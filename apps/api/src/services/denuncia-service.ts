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

/*
  Levar o aviso a quem administra o app.

  Cada administrador recebe na conversa que tem com a conta da casa. Um que
  não exista, ou uma DM que não abra, não pode derrubar a denúncia: o registro
  já está gravado, então a falha só vai para o log.
*/
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

/*
  Denunciar uma comunidade.

  Fica registrado e vai, na hora, para a conversa que cada administrador do
  app tem com a conta da casa — o mesmo canal dos outros avisos. Quem
  denuncia precisa estar na comunidade: não se denuncia o que não se viu.
*/
/*
  Uma denúncia pronta para a fila da administração.

  Vem com o alvo já resolvido: quem lê precisa do nome da comunidade ou do
  trecho da mensagem, não de um id para procurar à mão. O trecho sai do
  registro, e não da mensagem — ela pode ter sido apagada justamente por
  causa disto, e o que valia julgar é o que foi escrito na hora.
*/
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

  /*
    A fila da administração.

    Por padrão só o que ainda não teve desfecho, da mais nova para a mais
    velha: quem abre a tela quer ver o que falta, não o arquivo. Uma página
    de cada vez, porque a lista cresce e ninguém lê mil de uma vez.
  */
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

  /*
    Dar desfecho a uma denúncia.

    Não age sozinha: apagar mensagem, banir e verificar comunidade continuam
    sendo decisões separadas, tomadas com as ferramentas de sempre. Isto aqui
    só tira o item da fila e registra quem olhou — a fila existe para não
    perder denúncia de vista, não para agir por conta própria.
  */
  async resolver(adminId: string, denunciaId: string, decisao: "procede" | "arquivada") {
    const existente = await prisma.denuncia.findUnique({ where: { id: denunciaId } });
    if (!existente) throw new NotFoundError("Denúncia não encontrada");

    await prisma.denuncia.update({
      where: { id: denunciaId },
      data: { resolvidaEm: new Date(), resolvidaPor: adminId, decisao },
    });

    return { id: denunciaId, decisao };
  },

  /*
    Reabrir: engano acontece, e uma denúncia arquivada por engano some da
    fila para sempre se não houver volta.
  */
  async reabrir(denunciaId: string) {
    await prisma.denuncia.update({
      where: { id: denunciaId },
      data: { resolvidaEm: null, resolvidaPor: null, decisao: null },
    });

    return { id: denunciaId };
  },

  /*
    Denunciar uma mensagem.

    Vale onde a pessoa enxerga: canal de comunidade ou conversa privada. Não
    se denuncia a própria mensagem nem a da conta da casa. O texto vai copiado
    para o registro porque quem escreveu pode apagar antes de alguém olhar.
  */
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
