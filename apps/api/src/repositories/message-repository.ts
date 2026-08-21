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

  markRead(userId: string, channelId: string, messageId: string) {
    return prisma.readState.upsert({
      where: { userId_channelId: { userId, channelId } },
      create: { userId, channelId, lastReadMessageId: messageId, mentionCount: 0 },
      update: { lastReadMessageId: messageId, mentionCount: 0 },
    });
  },
};
