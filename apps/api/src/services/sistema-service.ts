import type { FastifyBaseLogger } from "fastify";

import { THEME_PATH, rooms } from "@gravae/shared";

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
import { messageService } from "~/services/message-service.js";
import { readHouseThemes, type HouseTheme } from "~/temas-da-casa.js";

export const HOUSE_EMAIL = "sistema@gravae.local";
const SERVER_NAME = "Gravaê Temas";
const CHANNEL_NAME = "temas";

const DEVELOPERS_SERVER = "Gravaê Developers";
const HOUSE_SERVER = "Gravaê HQ";

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
    name: "gravae-developers",
    topic: "A casa de quem constrói no Gravaê.",
    url: "https://gravae.io/developers",
  },
  {
    category: null,
    name: "gravae-temas",
    topic: "Os temas feitos pela casa.",
    url: "https://gravae.io/temas",
  },
  { category: "Gravaê", name: "novidades", topic: "O que mudou, e quando." },
  { category: "Gravaê", name: "perguntas-frequentes", topic: "As dúvidas que mais chegam." },
  { category: "Gravaê", name: "no-que-estamos", topic: "O que está sendo construído agora." },
  {
    category: "Gravaê",
    name: "central-de-ajuda",
    topic: "Os guias escritos da casa.",
    url: "https://gravae.io/ajuda",
  },
  { category: "Gravaê", name: "estado-da-plataforma", topic: "Se caiu, o aviso sai aqui." },
  { category: "Gravaê", name: "quebrou-alguma-coisa", topic: "Conte o que deu errado." },
  {
    category: "Gravaê",
    name: "por-vir",
    topic: "O caminho até as próximas entregas.",
    url: "https://gravae.io/roadmap",
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
  { category: "Meta", name: "novidades", topic: "O que mudou no Gravaê." },
  { category: "Meta", name: "materiais", topic: "Documentação, exemplos e links úteis." },
  { category: "Terminal", name: "geral-dev", topic: "Conversa solta de quem constrói." },
  { category: "Terminal", name: "bots-e-api", topic: "A API pública e o @gravae/bot." },
  { category: "Terminal", name: "auto-hospedagem", topic: "Subir o Gravaê na sua própria máquina." },
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

    const livre = !(await userRepository.findByUsername("gravae"));

    return userRepository.create({
      email: HOUSE_EMAIL,
      username: livre ? "gravae" : "gravae-sistema",
      displayName: "Gravaê",
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
            "A casa de quem constrói no Gravaê: API, bots, temas e o que vem por aí.",
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
      log.warn(`Gravaê HQ: o dono ${env.HOUSE_OWNER_SERVER} ainda não tem conta`);
      return;
    }

    let guild = await prisma.guild.findFirst({
      where: { ownerId: owner.id, name: HOUSE_SERVER },
    });

    if (!guild) {
      const created = await guildService.create(owner.id, { name: HOUSE_SERVER });
      guild = await prisma.guild.findUniqueOrThrow({ where: { id: created.id } });
      log.info(`Gravaê HQ: criado para ${owner.username}`);
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
            "A casa oficial do Gravaê: novidades, ajuda, o que quebrou e o que vem por aí.",
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

      log.info(`Gravaê HQ: canal ${channel.name} criado`);
    }
  },

  async themePublished(theme: HouseTheme, houseId: string) {
    const existing = await prisma.theme.findFirst({ where: { authorId: houseId, name: theme.name } });

    if (!existing) {
      return prisma.theme.create({
        data: {
          name: theme.name,
          description: theme.description,
          author: "Gravaê",
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
