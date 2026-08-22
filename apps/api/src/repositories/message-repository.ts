import type { Attachment, Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";
import { unset } from "~/lib/mongo.js";

/** Mensagens não apagadas. Ver a nota em lib/mongo.ts sobre null vs ausente. */
const notDeleted = unset("deletedAt") satisfies Prisma.MessageWhereInput;

export const messageInclude = {
  author: true,
  reactions: true,
  sticker: true,
} satisfies Prisma.MessageInclude;

export const messageRepository = {
  findById(id: string) {
    return prisma.message.findUnique({ where: { id } });
  },

  findByIdWithRelations(id: string) {
    return prisma.message.findUniqueOrThrow({ where: { id }, include: messageInclude });
  },

  /**
   * Histórico paginado por cursor. Cursor e não offset porque o feed cresce
   * enquanto o usuário rola: com skip/limit, mensagens novas empurram a janela
   * e o leitor vê conteúdo repetido.
   */
  findPage(params: { channelId: string; postId?: string | null; before?: string; limit: number }) {
    return prisma.message.findMany({
      where: {
        channelId: params.channelId,
        /**
         * No fórum a conversa é por assunto. Fora dele, `postId` tem que estar
         * AUSENTE — ver a nota em lib/mongo.ts: no Mongo, `campo: null` não
         * encontra documento que simplesmente não tem o campo.
         *
         * Os dois filtros vão dentro de `AND` porque cada `unset()` devolve um
         * `OR`: espalhados no mesmo objeto, o segundo sobrescreveria o
         * primeiro e o filtro sumiria sem erro nenhum.
         */
        AND: [params.postId ? { postId: params.postId } : unset("postId"), notDeleted],
      },
      include: messageInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: params.limit,
      ...(params.before ? { cursor: { id: params.before }, skip: 1 } : {}),
    });
  },

  create(data: {
    channelId: string;
    authorId: string;
    content: string;
    attachments: Attachment[];
    replyToId: string | null;
    mentions: string[];
    tipo?: "USER" | "JOIN";
    poll?: Prisma.PollCreateInput;
    stickerId?: string;
    postId?: string;
  }) {
    return prisma.message.create({ data, include: messageInclude });
  },

  update(id: string, data: Prisma.MessageUpdateInput) {
    return prisma.message.update({ where: { id }, data, include: messageInclude });
  },

  /** Soft delete: manter a linha preserva as respostas que apontam pra ela. */
  softDelete(id: string) {
    return prisma.message.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  /**
   * Limpeza pós-banimento: apaga o que a pessoa escreveu nas últimas horas,
   * em todos os canais do servidor. Soft delete, como qualquer exclusão aqui.
   */
  async softDeleteRecentByAuthor(guildId: string, authorId: string, desde: Date) {
    const canais = await prisma.channel.findMany({ where: { guildId }, select: { id: true } });

    await prisma.message.updateMany({
      where: {
        authorId,
        channelId: { in: canais.map((c) => c.id) },
        createdAt: { gte: desde },
        ...notDeleted,
      },
      data: { deletedAt: new Date() },
    });
  },

  countPinned(channelId: string) {
    return prisma.message.count({ where: { channelId, pinnedAt: { not: null }, ...notDeleted } });
  },

  findPinned(channelId: string) {
    return prisma.message.findMany({
      where: { channelId, pinnedAt: { not: null }, ...notDeleted },
      include: messageInclude,
      orderBy: { pinnedAt: "desc" },
    });
  },

  countByAuthor(authorId: string) {
    return prisma.message.count({ where: { authorId } });
  },
};

export const reactionRepository = {
  findManyByMessage(messageId: string) {
    return prisma.reaction.findMany({ where: { messageId }, select: { emoji: true, userId: true } });
  },

  /** Já reagiu = unique constraint. Não é erro, é idempotência. */
  add(messageId: string, userId: string, emoji: string) {
    return prisma.reaction.create({ data: { messageId, userId, emoji } }).catch(() => undefined);
  },

  remove(messageId: string, userId: string, emoji: string) {
    return prisma.reaction
      .delete({ where: { messageId_userId_emoji: { messageId, userId, emoji } } })
      .catch(() => undefined);
  },
};

export const readStateRepository = {
  findManyByUser(userId: string) {
    return prisma.readState.findMany({ where: { userId } });
  },

  /**
   * Quantas mensagens entraram depois da última lida.
   *
   * Compara por `id` e não por data: no Mongo o ObjectId já embute o instante
   * de criação e é monotônico, então `gt` no id ordena igual à data — é o
   * mesmo truque que a paginação por cursor daqui já usa, sem precisar buscar
   * a mensagem lida só pra descobrir o `createdAt` dela.
   */
  countUnread(channelId: string, afterMessageId: string) {
    return prisma.message.count({
      where: { channelId, id: { gt: afterMessageId } },
    });
  },

  /**
   * Quantas dessas nao-lidas sao PRA VOCE.
   *
   * A expansao cargo -> pessoa acontece aqui, na leitura: `mentionRoleIds`
   * guarda o cargo, e quem esta nele hoje e quem recebe. Congelar a lista de
   * pessoas na escrita ignoraria quem entrou depois e pingaria pra sempre quem
   * saiu.
   *
   * Da pra passar os cargos de TODOS os servidores sem filtrar por servidor: id
   * de cargo e um ObjectId unico, entao um cargo de outro servidor nao tem como
   * aparecer nas mensagens deste canal.
   */
  countMentions(channelId: string, afterMessageId: string, userId: string, roleIds: string[]) {
    return prisma.message.count({
      where: {
        channelId,
        id: { gt: afterMessageId },
        // a propria mensagem nao conta: quem escreveu ja sabe que escreveu
        authorId: { not: userId },
        OR: [
          { mentions: { has: userId } },
          { mentionEveryone: true },
          ...(roleIds.length ? [{ mentionRoleIds: { hasSome: roleIds } }] : []),
        ],
      },
    });
  },

  markRead(userId: string, channelId: string, messageId: string) {
    return prisma.readState.upsert({
      where: { userId_channelId: { userId, channelId } },
      create: { userId, channelId, lastReadMessageId: messageId, mentionCount: 0 },
      update: { lastReadMessageId: messageId, mentionCount: 0 },
    });
  },
};

/**
 * Números sobre o que uma pessoa mandou num servidor.
 *
 * Existe separado do `messageRepository` porque não serve pra ler mensagem:
 * é material da tela de moderação, e contagem é a única coisa que sai daqui.
 */
export const messageStatsRepository = {
  /**
   * Conta mensagens, links e mídia de um usuário nos canais informados.
   *
   * Os canais chegam prontos (a rota já sabe quais são do servidor) em vez de
   * um `join`: o Prisma com Mongo não faz relação em `count`, e uma consulta
   * por canal seria muito pior que três consultas com `in`.
   */
  async byUserInChannels(userId: string, channelIds: string[]) {
    if (!channelIds.length) return { mensagens: 0, links: 0, midia: 0 };

    const base = { authorId: userId, channelId: { in: channelIds } };

    const [mensagens, links, midia] = await Promise.all([
      prisma.message.count({ where: base }),
      // http:// ou https:// em qualquer posição do texto
      prisma.message.count({ where: { ...base, content: { contains: "http" } } }),
      prisma.message.count({ where: { ...base, attachments: { isEmpty: false } } }),
    ]);

    return { mensagens, links, midia };
  },

  /**
   * As mensagens em si, para o "ver mais" da visualização de moderador.
   *
   * Vem com o canal junto porque a lista é agrupada por canal na tela — sem o
   * `include` seriam N consultas para descobrir o nome de cada um.
   */
  findByUserInChannels(params: {
    userId: string;
    channelIds: string[];
    filtro: "todas" | "links" | "midia";
    limit: number;
    before?: string;
  }) {
    if (!params.channelIds.length) return Promise.resolve([]);

    return prisma.message.findMany({
      where: {
        authorId: params.userId,
        channelId: { in: params.channelIds },
        ...(params.filtro === "links" ? { content: { contains: "http" } } : {}),
        ...(params.filtro === "midia" ? { attachments: { isEmpty: false } } : {}),
        ...(params.before ? { id: { lt: params.before } } : {}),
      },
      include: { author: true, channel: true },
      orderBy: { createdAt: "desc" },
      take: params.limit,
    });
  },
};
