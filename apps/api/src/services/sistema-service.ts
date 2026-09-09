import type { FastifyBaseLogger } from "fastify";

import { CAMINHO_DO_TEMA, rooms } from "@gravae/shared";

import { env } from "~/env.js";
import { unset } from "~/lib/mongo.js";
import { prisma } from "~/lib/prisma.js";
import { toMessage } from "~/lib/serialize.js";
import { enviarMensagem } from "~/realtime/difusao.js";
import { io } from "~/realtime/io.js";
import { dmRepository } from "~/repositories/friendship-repository.js";
import { categoryRepository } from "~/repositories/guild-repository.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { guildService } from "~/services/guild-service.js";
import { messageService } from "~/services/message-service.js";
import { lerTemasDaCasa, type TemaDaCasa } from "~/temas-da-casa.js";

export const EMAIL_DA_CASA = "sistema@gravae.local";
const NOME_DO_SERVIDOR = "Gravaê Temas";
const NOME_DO_CANAL = "temas";

function textoDoTema(tema: TemaDaCasa, link: string): string {
  return [
    `${tema.nome}: ${tema.descricao}`,
    "",
    `Versão ${tema.versao || "1.0.0"} · feito pela casa.`,
    link,
  ].join("\n");
}

export const sistemaService = {
  async avisar(userId: string, texto: string, log?: FastifyBaseLogger) {
    try {
      const casa = await sistemaService.usuario();
      if (casa.id === userId) return;

      const canal =
        (await dmRepository.findBetween(casa.id, userId)) ?? (await dmRepository.create([casa.id, userId]));

      await enviarMensagem(casa.id, { channelId: canal.id, content: texto });
    } catch (err) {
      log?.error({ err }, "aviso do sistema não chegou");
    }
  },

  async escreverNoCanal(channelId: string, content: string) {
    const casa = await sistemaService.usuario();

    const criada = await messageRepository.create({
      channelId,
      authorId: casa.id,
      content,
      attachments: [],
      replyToId: null,
      mentions: [],
    });

    const mensagem = toMessage(criada, casa.id);
    io().to(rooms.channel(channelId)).emit("message:created", mensagem);

    return mensagem;
  },

  async usuario() {
    const existente = await userRepository.findByEmail(EMAIL_DA_CASA);

    if (existente) {
      if (!existente.isBot) return existente;

      return userRepository.update(existente.id, { isBot: false, sistema: true });
    }

    const livre = !(await userRepository.findByUsername("gravae"));

    return userRepository.create({
      email: EMAIL_DA_CASA,
      username: livre ? "gravae" : "gravae-sistema",
      displayName: "Gravaê",
      avatarUrl: `${env.WEB_ORIGIN}/brand/icone-512.png`,
      isBot: false,
      sistema: true,
    });
  },

  async comunicar(userIds: string[], texto: string, log: FastifyBaseLogger) {
    const casa = await sistemaService.usuario();
    const destinos = [...new Set(userIds)].filter((id) => id !== casa.id);

    void (async () => {
      let entregues = 0;
      let falhas = 0;

      for (const userId of destinos) {
        try {
          const canal =
            (await dmRepository.findBetween(casa.id, userId)) ?? (await dmRepository.create([casa.id, userId]));

          await enviarMensagem(casa.id, { channelId: canal.id, content: texto });
          entregues++;
        } catch (err) {
          falhas++;
          log.error({ err, userId }, "comunicado não chegou");
        }
      }

      log.info({ entregues, falhas }, "comunicado do sistema entregue");
    })();

    return { destinatarios: destinos.length };
  },

  async semearServidorDeTemas(log: FastifyBaseLogger) {
    if (!env.SERVIDOR_DE_TEMAS_DONO) return;

    const dono = await userRepository.findByEmail(env.SERVIDOR_DE_TEMAS_DONO);
    if (!dono) {
      log.warn(`servidor de temas: o dono ${env.SERVIDOR_DE_TEMAS_DONO} ainda não tem conta`);
      return;
    }

    const casa = await this.usuario();

    let guild = await prisma.guild.findFirst({
      where: { ownerId: dono.id, name: NOME_DO_SERVIDOR },
    });

    if (!guild) {
      const criado = await guildService.create(dono.id, { name: NOME_DO_SERVIDOR });
      guild = await prisma.guild.findUniqueOrThrow({ where: { id: criado.id } });
      log.info(`servidor de temas: "${NOME_DO_SERVIDOR}" criado para ${dono.username}`);
    }

    if (!guild.verificada) {
      guild = await prisma.guild.update({ where: { id: guild.id }, data: { verificada: true } });
    }

    let canal = await prisma.channel.findFirst({
      where: { guildId: guild.id, name: NOME_DO_CANAL, type: "TEXT" },
    });

    if (!canal) {
      const [categoria] = await categoryRepository.findManyByGuild(guild.id);
      const criado = await guildService.createChannel(dono.id, guild.id, {
        name: NOME_DO_CANAL,
        type: "TEXT",
        categoryId: categoria?.id ?? null,
        topic: "Os temas feitos pela casa. Baixe, importe no estúdio e use.",
      });
      canal = await prisma.channel.findUniqueOrThrow({ where: { id: criado.id } });
    }

    const saiu = await prisma.guildMember.deleteMany({ where: { userId: casa.id } });
    if (saiu.count) log.info(`servidor de temas: a conta da casa saiu de ${saiu.count} servidor(es)`);

    for (const tema of lerTemasDaCasa()) {
      try {
        await this.publicarTema(tema, { canalId: canal.id, casaId: casa.id, donoId: dono.id }, log);
      } catch (err) {
        log.error({ err }, `servidor de temas: falhou ao publicar ${tema.chave}`);
      }
    }
  },

  async temaPublicado(tema: TemaDaCasa, casaId: string) {
    const existente = await prisma.tema.findFirst({ where: { autorId: casaId, nome: tema.nome } });

    if (!existente) {
      return prisma.tema.create({
        data: {
          nome: tema.nome,
          descricao: tema.descricao,
          autor: "Gravaê",
          versao: tema.versao,
          tags: [],
          css: tema.css,
          substituicoes: {},
          autorId: casaId,
        },
      });
    }

    if (existente.css === tema.css) return existente;

    return prisma.tema.update({
      where: { id: existente.id },
      data: { css: tema.css, descricao: tema.descricao, versao: tema.versao },
    });
  },

  async publicarTema(
    tema: TemaDaCasa,
    ids: { canalId: string; casaId: string; donoId: string },
    log: FastifyBaseLogger,
  ) {
    const publicado = await sistemaService.temaPublicado(tema, ids.casaId);
    const content = textoDoTema(tema, `${env.WEB_ORIGIN.split(",")[0]?.trim() ?? ""}${CAMINHO_DO_TEMA}${publicado.id}`);

    const existente = await prisma.message.findFirst({
      where: {
        channelId: ids.canalId,
        authorId: ids.casaId,
        ...unset("deletedAt"),
        content: { contains: publicado.id },
      },
    });

    if (existente && existente.content === content) {
      if (!existente.pinnedAt) await messageService.pin(ids.donoId, existente.id, true);
      return;
    }

    if (existente) await messageService.remove(ids.donoId, existente.id);

    const comArquivo = await prisma.message.findFirst({
      where: {
        channelId: ids.canalId,
        authorId: ids.casaId,
        ...unset("deletedAt"),
        attachments: { some: { filename: `${tema.chave}.css` } },
      },
    });

    if (comArquivo) await messageService.remove(ids.donoId, comArquivo.id);

    const mensagem = await sistemaService.escreverNoCanal(ids.canalId, content);

    await messageService.pin(ids.donoId, mensagem.id, true);
    log.info(`servidor de temas: ${tema.nome} publicado e fixado`);
  },
};
