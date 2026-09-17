import type { FastifyBaseLogger } from "fastify";

import { BRAND_NAME, SITE_URL, THEME_PATH, rooms } from "@gravae/shared";

import { env } from "~/env.js";
import { unset } from "~/lib/mongo.js";
import { prisma } from "~/lib/prisma.js";
import { toMessage } from "~/lib/serialize.js";
import { sendMessage } from "~/realtime/difusao.js";
import { io } from "~/realtime/io.js";
import { dmRepository } from "~/repositories/friendship-repository.js";
import { categoryRepository } from "~/repositories/guild-repository.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { guildService } from "~/services/guild-service.js";
import {
  LEGACY_BRAND,
  LEGACY_CHANNEL_NAMES,
  LEGACY_HOUSE_USERNAME,
  LEGACY_SERVER_NAMES,
  withoutLegacyBrand,
} from "~/services/legacy-brand.js";
import { messageService } from "~/services/message-service.js";
import { readHouseThemes, type HouseTheme } from "~/temas-da-casa.js";

export const HOUSE_EMAIL = "sistema@gravae.local";
const SERVER_NAME = "Ravox Temas";
const HOUSE_USERNAME = "ravox";
const CHANNEL_NAME = "temas";

const DEVELOPERS_SERVER = "Ravox Developers";
const HOUSE_SERVER = "Ravox HQ";

const HOUSE_CHANNELS: {
  category: string | null;
  name: string;
  topic: string;
  url?: string;
}[] = [
  { category: null, name: "boas-vindas", topic: "Quem chega, começa por aqui." },
  { category: null, name: "regras", topic: "O combinado de quem fica." },
  {
    category: null,
    name: "ravox-developers",
    topic: "A casa de quem constrói no Ravox Chat.",
    url: `${SITE_URL}/desenvolvedores`,
  },
  {
    category: null,
    name: "ravox-temas",
    topic: "Os temas feitos pela casa.",
    url: `${SITE_URL}/desenvolvedores/temas`,
  },
  { category: BRAND_NAME, name: "novidades", topic: "O que mudou, e quando." },
  { category: BRAND_NAME, name: "perguntas-frequentes", topic: "As dúvidas que mais chegam." },
  { category: BRAND_NAME, name: "no-que-estamos", topic: "O que está sendo construído agora." },
  {
    category: BRAND_NAME,
    name: "central-de-ajuda",
    topic: "Os guias escritos da casa.",
    url: `${SITE_URL}/ajuda`,
  },
  { category: BRAND_NAME, name: "estado-da-plataforma", topic: "Se caiu, o aviso sai aqui." },
  { category: BRAND_NAME, name: "quebrou-alguma-coisa", topic: "Conte o que deu errado." },
  {
    category: BRAND_NAME,
    name: "por-vir",
    topic: "O caminho até as próximas entregas.",
    url: `${SITE_URL}/desenvolvedores/mudancas`,
  },
  { category: "Conversa", name: "papo-da-casa", topic: "Conversa solta de quem usa." },
  { category: "Conversa", name: "mostre-o-seu", topic: "Temas, bots e o que você fez." },
];

const DEVELOPERS_CHANNELS: {
  category: string | null;
  name: string;
  topic: string;
}[] = [
  {
    category: null,
    name: "boas-vindas",
    topic: "Quem chega, começa por aqui.",
  },
  { category: "Meta", name: "regras", topic: "O combinado da comunidade." },
  { category: "Meta", name: "novidades", topic: "O que mudou no Ravox Chat." },
  { category: "Meta", name: "materiais", topic: "Documentação, exemplos e links úteis." },
  { category: "Terminal", name: "geral-dev", topic: "Conversa solta de quem constrói." },
  { category: "Terminal", name: "bots-e-api", topic: "A API pública e o @gravae/bot." },
  { category: "Terminal", name: "auto-hospedagem", topic: "Subir o Ravox Chat na sua própria máquina." },
  { category: "Clientes", name: "clientes-mobile", topic: "Clientes de terceiros no celular." },
  { category: "Clientes", name: "clientes-desktop", topic: "Clientes de terceiros no computador." },
];

function themeText(theme: HouseTheme, link: string): string {
  return [
    `${theme.name}: ${theme.description}`,
    "",
    `Versão ${theme.version || "1.0.0"} · feito pela casa.`,
    link,
  ].join("\n");
}

export const systemService = {
  async notify(userId: string, text: string, log?: FastifyBaseLogger) {
    try {
      const house = await systemService.user();
      if (house.id === userId) return;

      const channel =
        (await dmRepository.findBetween(house.id, userId)) ?? (await dmRepository.create([house.id, userId]));

      await sendMessage(house.id, { channelId: channel.id, content: text });
    } catch (err) {
      log?.error({ err }, "aviso do sistema não chegou");
    }
  },

  async writeChannel(channelId: string, content: string) {
    const house = await systemService.user();

    const created = await messageRepository.create({
      channelId,
      authorId: house.id,
      content,
      attachments: [],
      replyToId: null,
      mentions: [],
    });

    const message = toMessage(created, house.id);
    io().to(rooms.channel(channelId)).emit("message:created", message);

    return message;
  },

  async user() {
    const existing = await userRepository.findByEmail(HOUSE_EMAIL);

    if (existing) {
      if (!existing.isBot) return existing;

      return userRepository.update(existing.id, { isBot: false, system: true });
    }

    const livre = !(await userRepository.findByUsername(HOUSE_USERNAME));

    return userRepository.create({
      email: HOUSE_EMAIL,
      username: livre ? HOUSE_USERNAME : `${HOUSE_USERNAME}-sistema`,
      displayName: BRAND_NAME,
      avatarUrl: `${env.WEB_ORIGIN}/brand/icone-512.png`,
      isBot: false,
      system: true,
    });
  },

  async announce(userIds: string[], text: string, log: FastifyBaseLogger) {
    const house = await systemService.user();
    const destinations = [...new Set(userIds)].filter((id) => id !== house.id);

    void (async () => {
      let delivered = 0;
      let failures = 0;

      for (const userId of destinations) {
        try {
          const channel =
            (await dmRepository.findBetween(house.id, userId)) ?? (await dmRepository.create([house.id, userId]));

          await sendMessage(house.id, { channelId: channel.id, content: text });
          delivered++;
        } catch (err) {
          failures++;
          log.error({ err, userId }, "comunicado não chegou");
        }
      }

      log.info({ delivered, failures }, "comunicado do sistema entregue");
    })();

    return { recipients: destinations.length };
  },

  async renameLegacyBrand(log: FastifyBaseLogger) {
    const house = await systemService.user();
    const houseChanges: { displayName?: string; username?: string } = {};

    if (house.displayName === LEGACY_BRAND) houseChanges.displayName = BRAND_NAME;
    if (house.username === LEGACY_HOUSE_USERNAME && !(await userRepository.findByUsername(HOUSE_USERNAME))) {
      houseChanges.username = HOUSE_USERNAME;
    }
    if (Object.keys(houseChanges).length) {
      await userRepository.update(house.id, houseChanges);
      log.info(houseChanges, "conta oficial: nome antigo trocado");
    }

    const themes = await prisma.theme.updateMany({
      where: { authorId: house.id, author: LEGACY_BRAND },
      data: { author: BRAND_NAME },
    });
    if (themes.count) log.info(`temas da casa: autor trocado em ${themes.count}`);

    const servers = [
      { ownerEmail: env.THEMES_OWNER_SERVER, from: LEGACY_SERVER_NAMES.themes, to: SERVER_NAME },
      { ownerEmail: env.DEVELOPERS_OWNER_SERVER, from: LEGACY_SERVER_NAMES.developers, to: DEVELOPERS_SERVER },
      { ownerEmail: env.HOUSE_OWNER_SERVER, from: LEGACY_SERVER_NAMES.house, to: HOUSE_SERVER },
    ];

    for (const { ownerEmail, from, to } of servers) {
      if (!ownerEmail) continue;

      const owner = await userRepository.findByEmail(ownerEmail);
      if (!owner) continue;

      const guild =
        (await prisma.guild.findFirst({ where: { ownerId: owner.id, name: to } })) ??
        (await prisma.guild.findFirst({ where: { ownerId: owner.id, name: from } }));
      if (!guild) continue;

      if (guild.name !== to || guild.description?.includes(LEGACY_BRAND)) {
        await prisma.guild.update({
          where: { id: guild.id },
          data: {
            name: to,
            ...(guild.description ? { description: withoutLegacyBrand(guild.description, BRAND_NAME) } : {}),
          },
        });
        log.info(`"${from}" agora é "${to}"`);
      }

      await prisma.category.updateMany({ where: { guildId: guild.id, name: LEGACY_BRAND }, data: { name: BRAND_NAME } });

      const channels = await prisma.channel.findMany({ where: { guildId: guild.id } });
      for (const channel of channels) {
        const name = LEGACY_CHANNEL_NAMES[channel.name] ?? channel.name;
        const topic = channel.topic ? withoutLegacyBrand(channel.topic, BRAND_NAME) : channel.topic;
        const url = HOUSE_CHANNELS.find((c) => c.name === name)?.url ?? channel.url;

        if (name === channel.name && topic === channel.topic && url === channel.url) continue;

        await prisma.channel.update({ where: { id: channel.id }, data: { name, topic, url } });
        log.info(`canal ${channel.name}: nome, descrição ou link atualizados`);
      }
    }
  },

  async removeServers(log: FastifyBaseLogger) {
    const house = await this.user();

    const left = await prisma.guildMember.deleteMany({ where: { userId: house.id } });
    if (left.count) log.info(`conta oficial: saiu de ${left.count} servidor(es)`);
  },

  async seedThemesServer(log: FastifyBaseLogger) {
    if (!env.THEMES_OWNER_SERVER) return;

    const owner = await userRepository.findByEmail(env.THEMES_OWNER_SERVER);
    if (!owner) {
      log.warn(`servidor de temas: o dono ${env.THEMES_OWNER_SERVER} ainda não tem conta`);
      return;
    }

    const house = await this.user();

    let guild = await prisma.guild.findFirst({
      where: { ownerId: owner.id, name: SERVER_NAME },
    });

    if (!guild) {
      const created = await guildService.create(owner.id, { name: SERVER_NAME });
      guild = await prisma.guild.findUniqueOrThrow({ where: { id: created.id } });
      log.info(`servidor de temas: "${SERVER_NAME}" criado para ${owner.username}`);
    }

    if (!guild.verified || guild.discoverable === false || !guild.description) {
      guild = await prisma.guild.update({
        where: { id: guild.id },
        data: {
          verified: true,
          discoverable: true,
          category: guild.category ?? "CRIADOR_DE_CONTEUDO",
          description:
            guild.description ??
            "Os temas feitos pela casa, prontos para importar no estúdio. Entre para ver o que sai de novo.",
        },
      });
    }

    let channel = await prisma.channel.findFirst({
      where: { guildId: guild.id, name: CHANNEL_NAME, type: "TEXT" },
    });

    if (!channel) {
      const [category] = await categoryRepository.findManyByGuild(guild.id);
      const created = await guildService.createChannel(owner.id, guild.id, {
        name: CHANNEL_NAME,
        type: "TEXT",
        categoryId: category?.id ?? null,
        topic: "Os temas feitos pela casa. Baixe, importe no estúdio e use.",
      });
      channel = await prisma.channel.findUniqueOrThrow({ where: { id: created.id } });
    }

    for (const theme of readHouseThemes()) {
      try {
        await this.publishTheme(theme, { channelId: channel.id, houseId: house.id, ownerId: owner.id }, log);
      } catch (err) {
        log.error({ err }, `servidor de temas: falhou ao publicar ${theme.key}`);
      }
    }
  },

  async seedDevelopersServer(log: FastifyBaseLogger) {
    if (!env.DEVELOPERS_OWNER_SERVER) return;

    const owner = await userRepository.findByEmail(env.DEVELOPERS_OWNER_SERVER);
    if (!owner) {
      log.warn(
        `servidor de desenvolvedores: o dono ${env.DEVELOPERS_OWNER_SERVER} ainda não tem conta`,
      );
      return;
    }

    let guild = await prisma.guild.findFirst({
      where: { ownerId: owner.id, name: DEVELOPERS_SERVER },
    });

    if (!guild) {
      const created = await guildService.create(owner.id, { name: DEVELOPERS_SERVER });
      guild = await prisma.guild.findUniqueOrThrow({ where: { id: created.id } });
      log.info(`servidor de desenvolvedores: criado para ${owner.username}`);
    }

    if (!guild.verified || guild.discoverable === false || !guild.description) {
      guild = await prisma.guild.update({
        where: { id: guild.id },
        data: {
          verified: true,
          discoverable: true,
          category: guild.category ?? "CIENCIA_E_TECNOLOGIA",
          description:
            guild.description ??
            "A casa de quem constrói no Ravox Chat: API, bots, temas e o que vem por aí.",
        },
      });
    }

    const categories = new Map(
      (await categoryRepository.findManyByGuild(guild.id)).map((c) => [c.name, c.id]),
    );

    for (const channel of DEVELOPERS_CHANNELS) {
      const alreadyExists = await prisma.channel.findFirst({
        where: { guildId: guild.id, name: channel.name, type: "TEXT" },
      });

      if (alreadyExists) continue;

      let categoryId = channel.category ? categories.get(channel.category) : null;

      if (channel.category && !categoryId) {
        const fresh = await guildService.createCategory(owner.id, guild.id, channel.category);
        categories.set(channel.category, fresh.id);
        categoryId = fresh.id;
      }

      await guildService.createChannel(owner.id, guild.id, {
        name: channel.name,
        type: "TEXT",
        categoryId: categoryId ?? null,
        topic: channel.topic,
      });

      log.info(`servidor de desenvolvedores: canal #${channel.name} criado`);
    }
  },

  async seedHouse(log: FastifyBaseLogger) {
    if (!env.HOUSE_OWNER_SERVER) return;

    const owner = await userRepository.findByEmail(env.HOUSE_OWNER_SERVER);
    if (!owner) {
      log.warn(`Ravox HQ: o dono ${env.HOUSE_OWNER_SERVER} ainda não tem conta`);
      return;
    }

    let guild = await prisma.guild.findFirst({
      where: { ownerId: owner.id, name: HOUSE_SERVER },
    });

    if (!guild) {
      const created = await guildService.create(owner.id, { name: HOUSE_SERVER });
      guild = await prisma.guild.findUniqueOrThrow({ where: { id: created.id } });
      log.info(`Ravox HQ: criado para ${owner.username}`);
    }

    if (!guild.verified || guild.discoverable === false || !guild.description) {
      guild = await prisma.guild.update({
        where: { id: guild.id },
        data: {
          verified: true,
          discoverable: true,
          category: guild.category ?? "CIENCIA_E_TECNOLOGIA",
          description:
            guild.description ??
            "A casa oficial do Ravox Chat: novidades, ajuda, o que quebrou e o que vem por aí.",
        },
      });
    }

    const categories = new Map(
      (await categoryRepository.findManyByGuild(guild.id)).map((c) => [c.name, c.id]),
    );

    for (const channel of HOUSE_CHANNELS) {
      const alreadyExists = await prisma.channel.findFirst({
        where: { guildId: guild.id, name: channel.name },
      });

      if (alreadyExists) continue;

      let categoryId = channel.category ? categories.get(channel.category) : null;

      if (channel.category && !categoryId) {
        const fresh = await guildService.createCategory(owner.id, guild.id, channel.category);
        categories.set(channel.category, fresh.id);
        categoryId = fresh.id;
      }

      await guildService.createChannel(owner.id, guild.id, {
        name: channel.name,
        type: channel.url ? "LINK" : "TEXT",
        ...(channel.url ? { url: channel.url } : {}),
        categoryId: categoryId ?? null,
        topic: channel.topic,
      });

      log.info(`Ravox HQ: canal ${channel.name} criado`);
    }
  },

  async themePublished(theme: HouseTheme, houseId: string) {
    const existing = await prisma.theme.findFirst({ where: { authorId: houseId, name: theme.name } });

    if (!existing) {
      return prisma.theme.create({
        data: {
          name: theme.name,
          description: theme.description,
          author: BRAND_NAME,
          version: theme.version,
          tags: [],
          css: theme.css,
          overrides: {},
          authorId: houseId,
        },
      });
    }

    if (existing.css === theme.css) return existing;

    return prisma.theme.update({
      where: { id: existing.id },
      data: { css: theme.css, description: theme.description, version: theme.version },
    });
  },

  async publishTheme(
    theme: HouseTheme,
    ids: { channelId: string; houseId: string; ownerId: string },
    log: FastifyBaseLogger,
  ) {
    const published = await systemService.themePublished(theme, ids.houseId);
    const content = themeText(theme, `${env.WEB_ORIGIN.split(",")[0]?.trim() ?? ""}${THEME_PATH}${published.id}`);

    const existing = await prisma.message.findFirst({
      where: {
        channelId: ids.channelId,
        authorId: ids.houseId,
        ...unset("deletedAt"),
        content: { contains: published.id },
      },
    });

    if (existing && existing.content === content) {
      if (!existing.pinnedAt) await messageService.pin(ids.ownerId, existing.id, true);
      return;
    }

    if (existing) await messageService.remove(ids.ownerId, existing.id);

    const withFile = await prisma.message.findFirst({
      where: {
        channelId: ids.channelId,
        authorId: ids.houseId,
        ...unset("deletedAt"),
        attachments: { some: { filename: `${theme.key}.css` } },
      },
    });

    if (withFile) await messageService.remove(ids.ownerId, withFile.id);

    const message = await systemService.writeChannel(ids.channelId, content);

    await messageService.pin(ids.ownerId, message.id, true);
    log.info(`servidor de temas: ${theme.name} publicado e fixado`);
  },
};
