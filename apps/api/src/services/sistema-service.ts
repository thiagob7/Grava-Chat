import type { FastifyBaseLogger } from "fastify";

import { CAMINHO_DO_TEMA } from "@gravae/shared";

import { env } from "~/env.js";
import { unset } from "~/lib/mongo.js";
import { prisma } from "~/lib/prisma.js";
import { enviarMensagem } from "~/realtime/difusao.js";
import { dmRepository } from "~/repositories/friendship-repository.js";
import { categoryRepository, memberRepository } from "~/repositories/guild-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { guildService } from "~/services/guild-service.js";
import { messageService } from "~/services/message-service.js";
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

function textoDoTema(tema: TemaDaCasa, link: string): string {
  return [
    `${tema.nome}: ${tema.descricao}`,
    "",
    `Versão ${tema.versao || "1.0.0"} · feito pela casa.`,
    link,
  ].join("\n");
}

export const sistemaService = {
  /*
    Um aviso da casa para uma pessoa.

    Vai pela conversa que ela já tem com a conta do sistema, ou por uma nova
    — é o mesmo lugar onde chegam os outros comunicados. Nunca derruba quem
    chamou: um aviso que falha é um aviso perdido, não uma ação perdida.
  */
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

  /*
    A conta da casa não é bot.

    Bot é o que alguém cria com código, ganha token e responde por conta
    própria — e por isso leva o selo "bot" e recebe mensagem. Esta aqui é o
    sistema: quem escreve por ela é a própria API, ninguém a controla, e o
    selo é "sistema". Nasceu marcada como bot por engano; quem já existe é
    corrigida aqui, uma vez.
  */
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

  /*
    Um comunicado da casa para muita gente.

    Vai em segundo plano e devolve na hora quantos vão receber: com mil
    pessoas na fila, esperar a última seria segurar a resposta por minutos.
    Cada entrega é independente — uma que falha não para as outras, só entra
    no log. Não pede amizade nem passa pelo freio de spam, porque quem manda
    é a casa e o destino é a conversa que ela já tem com cada um.
  */
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

  /*
    O tema da casa como registro publicado, para ter link.

    Um por nome: se já existe, só acompanha o CSS quando ele muda. Assim o
    link nunca troca — quem já colou o dele em algum canto continua valendo.
  */
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
    /*
      O tema vai como LINK, e não como arquivo: colado no canal, o link vira
      o cartão de importar, e quem lê aplica num clique em vez de baixar um
      `.css` e procurar onde enfiá-lo.
    */
    const publicado = await sistemaService.temaPublicado(tema, ids.casaId);
    const content = textoDoTema(tema, `${env.WEB_ORIGIN.split(",")[0]?.trim() ?? ""}${CAMINHO_DO_TEMA}${publicado.id}`);

    const existente = await prisma.message.findFirst({
      /// `deletedAt: null` não acha documento sem o campo no Mongo; o certo
      /// é perguntar se o campo está ausente, como o repositório faz.
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

    if (existente) await messageService.remove(ids.casaId, existente.id);

    /*
      A versão antiga deste tema vinha como arquivo anexado. Ela sai quando o
      link entra — senão o canal fica com o mesmo tema duas vezes, e a pessoa
      não sabe qual dos dois é o de verdade.
    */
    const comArquivo = await prisma.message.findFirst({
      where: {
        channelId: ids.canalId,
        authorId: ids.casaId,
        ...unset("deletedAt"),
        attachments: { some: { filename: `${tema.chave}.css` } },
      },
    });

    if (comArquivo) await messageService.remove(ids.casaId, comArquivo.id);

    const mensagem = await enviarMensagem(ids.casaId, { channelId: ids.canalId, content });

    await messageService.pin(ids.donoId, mensagem.id, true);
    log.info(`servidor de temas: ${tema.nome} publicado e fixado`);
  },
};
