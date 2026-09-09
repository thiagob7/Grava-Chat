import type { FastifyBaseLogger } from "fastify";

import { AppError, NotFoundError } from "~/lib/http.js";
import { ADMINS } from "~/lib/serialize.js";
import { env } from "~/env.js";
import { prisma } from "~/lib/prisma.js";
import { enviarMensagem } from "~/realtime/difusao.js";
import { dmRepository } from "~/repositories/friendship-repository.js";
import { guildRepository } from "~/repositories/guild-repository.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "~/services/access-service.js";
import { sistemaService } from "~/services/sistema-service.js";

export const MOTIVOS_DE_DENUNCIA = ["spam", "assedio", "conteudo", "golpe", "outro"] as const;
export type MotivoDeDenuncia = (typeof MOTIVOS_DE_DENUNCIA)[number];

const NOME_DO_MOTIVO: Record<MotivoDeDenuncia, string> = {
  spam: "Spam ou propaganda",
  assedio: "Assédio ou ódio",
  conteudo: "Conteúdo impróprio",
  golpe: "Golpe ou fraude",
  outro: "Outro",
};

const TRECHO = 300;

const web = () => env.WEB_ORIGIN.split(",")[0]?.trim() ?? "";

async function avisarAdministradores(texto: string, log?: FastifyBaseLogger) {
  const casa = await sistemaService.usuario();

  for (const email of ADMINS) {
    try {
      const admin = await userRepository.findByEmail(email);
      if (!admin || admin.id === casa.id) continue;

      const canal =
        (await dmRepository.findBetween(casa.id, admin.id)) ?? (await dmRepository.create([casa.id, admin.id]));

      await enviarMensagem(casa.id, { channelId: canal.id, content: texto });
    } catch (err) {
      log?.error({ err }, `denúncia: não deu para avisar ${email}`);
    }
  }
}

export interface DenunciaNaFila {
  id: string;
  tipo: "comunidade" | "mensagem";
  motivo: MotivoDeDenuncia;
  motivoEscrito: string;
  detalhes: string | null;
  createdAt: string;
  resolvidaEm: string | null;
  decisao: string | null;
  autor: { id: string; username: string; displayName: string } | null;
  comunidade: { id: string; nome: string } | null;
  mensagem: {
    id: string;
    channelId: string;
    guildId: string | null;
    trecho: string;
    autor: { id: string; username: string; displayName: string } | null;
  } | null;
}

export const denunciaService = {
  async denunciarServidor(
    userId: string,
    guildId: string,
    dados: { motivo: MotivoDeDenuncia; detalhes?: string },
    log?: FastifyBaseLogger,
  ) {
    await accessService.requireMember(userId, guildId);
    const guild = await guildRepository.findByIdOrThrow(guildId);
    const autor = await userRepository.findByIdOrThrow(userId);

    const denuncia = await prisma.denuncia.create({
      data: { guildId, autorId: userId, motivo: dados.motivo, detalhes: dados.detalhes ?? null },
    });

    await avisarAdministradores(
      [
        `Denúncia de comunidade: ${guild.name} (${guild.id})`,
        `Motivo: ${NOME_DO_MOTIVO[dados.motivo]}`,
        dados.detalhes ? `Detalhes: ${dados.detalhes}` : null,
        `Por @${autor.username} (${autor.id})`,
      ]
        .filter(Boolean)
        .join("\n"),
      log,
    );

    return { id: denuncia.id };
  },

  async listar(filtro: { pendentes?: boolean; antesDe?: string; limite?: number } = {}) {
    const limite = Math.min(filtro.limite ?? 50, 100);

    const denuncias = await prisma.denuncia.findMany({
      where: {
        ...(filtro.pendentes ? { resolvidaEm: null } : {}),
        ...(filtro.antesDe ? { id: { lt: filtro.antesDe } } : {}),
      },
      orderBy: { id: "desc" },
      take: limite + 1,
    });

    const temMais = denuncias.length > limite;
    const pagina = temMais ? denuncias.slice(0, limite) : denuncias;

    const idsDeGente = [
      ...new Set(pagina.flatMap((d) => [d.autorId, d.acusadoId].filter(Boolean) as string[])),
    ];
    const idsDeServidor = [...new Set(pagina.map((d) => d.guildId).filter(Boolean) as string[])];

    const [gente, servidores] = await Promise.all([
      idsDeGente.length ? userRepository.findManyByIds(idsDeGente) : [],
      idsDeServidor.length ? guildRepository.findManyByIds(idsDeServidor) : [],
    ]);

    const quem = new Map(gente.map((u) => [u.id, { id: u.id, username: u.username, displayName: u.displayName }]));
    const onde = new Map(servidores.map((g) => [g.id, g]));

    const itens: DenunciaNaFila[] = pagina.map((d) => {
      const ehDeMensagem = d.tipo === "mensagem";
      const servidor = d.guildId ? onde.get(d.guildId) : null;

      return {
        id: d.id,
        tipo: ehDeMensagem ? "mensagem" : "comunidade",
        motivo: d.motivo as MotivoDeDenuncia,
        motivoEscrito: NOME_DO_MOTIVO[d.motivo as MotivoDeDenuncia] ?? d.motivo,
        detalhes: d.detalhes,
        createdAt: d.createdAt.toISOString(),
        resolvidaEm: d.resolvidaEm?.toISOString() ?? null,
        decisao: d.decisao,
        autor: quem.get(d.autorId) ?? null,
        comunidade: servidor ? { id: servidor.id, nome: servidor.name } : null,
        mensagem:
          ehDeMensagem && d.messageId && d.channelId
            ? {
                id: d.messageId,
                channelId: d.channelId,
                guildId: d.guildId,
                trecho: d.trecho ?? "",
                autor: d.acusadoId ? (quem.get(d.acusadoId) ?? null) : null,
              }
            : null,
      };
    });

    return { itens, proxima: temMais ? (pagina.at(-1)?.id ?? null) : null };
  },

  async resolver(adminId: string, denunciaId: string, decisao: "procede" | "arquivada") {
    const existente = await prisma.denuncia.findUnique({ where: { id: denunciaId } });
    if (!existente) throw new NotFoundError("Denúncia não encontrada");

    await prisma.denuncia.update({
      where: { id: denunciaId },
      data: { resolvidaEm: new Date(), resolvidaPor: adminId, decisao },
    });

    return { id: denunciaId, decisao };
  },

  async reabrir(denunciaId: string) {
    await prisma.denuncia.update({
      where: { id: denunciaId },
      data: { resolvidaEm: null, resolvidaPor: null, decisao: null },
    });

    return { id: denunciaId };
  },

  async denunciarMensagem(
    userId: string,
    messageId: string,
    dados: { motivo: MotivoDeDenuncia; detalhes?: string },
    log?: FastifyBaseLogger,
  ) {
    const mensagem = await messageRepository.findById(messageId);
    if (!mensagem || mensagem.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    const { channel } = await accessService.requireChannelAccess(userId, mensagem.channelId);

    if (mensagem.authorId === userId) throw new AppError("Não dá para denunciar a própria mensagem");

    const casa = await sistemaService.usuario();
    if (mensagem.authorId === casa.id) throw new AppError("Não dá para denunciar a conta do sistema");

    const autor = await userRepository.findByIdOrThrow(userId);
    const acusado = await userRepository.findByIdOrThrow(mensagem.authorId);
    const trecho = mensagem.content.slice(0, TRECHO);

    const denuncia = await prisma.denuncia.create({
      data: {
        tipo: "mensagem",
        guildId: channel.guildId,
        channelId: channel.id,
        messageId: mensagem.id,
        acusadoId: acusado.id,
        trecho,
        autorId: userId,
        motivo: dados.motivo,
        detalhes: dados.detalhes ?? null,
      },
    });

    const guild = channel.guildId ? await guildRepository.findByIdOrThrow(channel.guildId) : null;
    const onde = guild ? `${guild.name} › #${channel.name ?? channel.id}` : "conversa privada";

    await avisarAdministradores(
      [
        `Denúncia de mensagem em ${onde}`,
        `Motivo: ${NOME_DO_MOTIVO[dados.motivo]}`,
        dados.detalhes ? `Detalhes: ${dados.detalhes}` : null,
        `De @${acusado.username} (${acusado.id}): ${trecho || "(sem texto)"}`,
        `Por @${autor.username} (${autor.id})`,
        `${web()}/channels/${channel.guildId ?? "@me"}/${channel.id}/${mensagem.id}`,
      ]
        .filter(Boolean)
        .join("\n"),
      log,
    );

    return { id: denuncia.id };
  },
};
