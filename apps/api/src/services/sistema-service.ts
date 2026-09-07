import type { FastifyBaseLogger } from "fastify";

import { env } from "~/env.js";
import { unset } from "~/lib/mongo.js";
import { prisma } from "~/lib/prisma.js";
import { enviarMensagem } from "~/realtime/difusao.js";
import { categoryRepository, memberRepository } from "~/repositories/guild-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { guildService } from "~/services/guild-service.js";
import { messageService } from "~/services/message-service.js";
import { uploadService } from "~/services/upload-service.js";
import { lerTemasDaCasa, type TemaDaCasa } from "~/temas-da-casa.js";

/*
  A conta da casa.

  É um usuário de verdade, como os bots: tem linha na tabela, aparece como
  autor, entra em servidor. A diferença é que ninguém a controla por token —
  é a própria API que escreve em nome dela, e o cliente a mostra com o selo
  "sistema" em vez de "app".
*/
export const EMAIL_DA_CASA = "sistema@gravae.local";
const NOME_DO_SERVIDOR = "Gravaê Temas";
const NOME_DO_CANAL = "temas";

function textoDoTema(tema: TemaDaCasa): string {
  return [
    `${tema.nome}: ${tema.descricao}`,
    "",
    `Versão ${tema.versao || "1.0.0"} · feito pela casa.`,
    "Baixe o arquivo e importe em Configurações > Aparência > Estúdio de temas > Biblioteca > Importar CSS.",
  ].join("\n");
}

export const sistemaService = {
  async usuario() {
    const existente = await userRepository.findByEmail(EMAIL_DA_CASA);
    if (existente) return existente;

    const livre = !(await userRepository.findByUsername("gravae"));

    return userRepository.create({
      email: EMAIL_DA_CASA,
      username: livre ? "gravae" : "gravae-sistema",
      displayName: "Gravaê",
      avatarUrl: `${env.WEB_ORIGIN}/brand/icone-512.png`,
      isBot: true,
      sistema: true,
    });
  },

  /*
    Garante o servidor "Gravaê Temas" e publica cada tema da casa lá, fixado.

    Roda a cada subida e não repete nada: servidor, canal, membro e mensagem
    só nascem se não existirem. Um tema que mudou de texto é publicado de
    novo — a mensagem antiga sai, a nova entra e é fixada.
  */
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

    if (!(await memberRepository.find(guild.id, casa.id))) {
      await memberRepository.create({ guildId: guild.id, userId: casa.id });
    }

    for (const tema of lerTemasDaCasa()) {
      try {
        await this.publicarTema(tema, { canalId: canal.id, casaId: casa.id, donoId: dono.id }, log);
      } catch (err) {
        log.error({ err }, `servidor de temas: falhou ao publicar ${tema.chave}`);
      }
    }
  },

  async publicarTema(
    tema: TemaDaCasa,
    ids: { canalId: string; casaId: string; donoId: string },
    log: FastifyBaseLogger,
  ) {
    const arquivo = `${tema.chave}.css`;
    const content = textoDoTema(tema);

    const existente = await prisma.message.findFirst({
      /// `deletedAt: null` não acha documento sem o campo no Mongo; o certo
      /// é perguntar se o campo está ausente, como o repositório faz.
      where: {
        channelId: ids.canalId,
        authorId: ids.casaId,
        ...unset("deletedAt"),
        attachments: { some: { filename: arquivo } },
      },
    });

    if (existente && existente.content === content) {
      if (!existente.pinnedAt) await messageService.pin(ids.donoId, existente.id, true);
      return;
    }

    if (existente) await messageService.remove(ids.casaId, existente.id);

    const anexo = await uploadService.upload(ids.casaId, {
      filename: arquivo,
      contentType: "text/css",
      body: Buffer.from(tema.css, "utf8"),
    });

    const mensagem = await enviarMensagem(ids.casaId, {
      channelId: ids.canalId,
      content,
      attachments: [anexo],
    });

    await messageService.pin(ids.donoId, mensagem.id, true);
    log.info(`servidor de temas: ${tema.nome} publicado e fixado`);
  },
};
