import { Prisma } from "@prisma/client";
import type { Attachment } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";
import { unset } from "~/lib/mongo.js";

const notDeleted = unset("deletedAt") satisfies Prisma.MessageWhereInput;

export const messageInclude = {
  author: true,
  reactions: true,
  sticker: true,
} satisfies Prisma.MessageInclude;

export const messageRepository = {
  findMentions(userId: string, channelIds: string[], desde: Date) {
    return prisma.message.findMany({
      where: {
        deletedAt: null,
        channelId: { in: channelIds },
        mentions: { has: userId },
        authorId: { not: userId },
        createdAt: { gte: desde },
      },
      include: { author: true, reactions: true, sticker: true },
      orderBy: { id: "desc" },
      take: 50,
    });
  },

  findById(id: string) {
    return prisma.message.findUnique({ where: { id } });
  },

  findPreviousIn(channelId: string, messageId: string) {
    return prisma.message.findFirst({
      where: { channelId, deletedAt: null, id: { lt: messageId } },
      orderBy: { id: "desc" },
      select: { id: true },
    });
  },

  findByIdWithRelations(id: string) {
    return prisma.message.findUniqueOrThrow({ where: { id }, include: messageInclude });
  },

  findPage(params: { channelId: string; postId?: string | null; before?: string; limit: number }) {
    return prisma.message.findMany({
      where: {
        channelId: params.channelId,
        AND: [params.postId ? { postId: params.postId } : unset("postId"), notDeleted],
      },
      include: messageInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: params.limit,
      ...(params.before ? { cursor: { id: params.before }, skip: 1 } : {}),
    });
  },

  buscar(params: {
    channelIds: string[];
    termo: string;
    autorId?: string;
    canalId?: string;
    limit: number;
    before?: string;
  }) {
    const canais = params.canalId
      ? params.channelIds.filter((id) => id === params.canalId)
      : params.channelIds;

    if (!canais.length) return Promise.resolve([]);

    return prisma.message.findMany({
      where: {
        channelId: { in: canais },
        content: { contains: params.termo, mode: "insensitive" },
        ...(params.autorId ? { authorId: params.autorId } : {}),
        ...(params.before ? { id: { lt: params.before } } : {}),
        AND: [notDeleted],
      },
      include: { ...messageInclude, channel: true },
      orderBy: { id: "desc" },
      take: params.limit,
    });
  },

  create(data: {
    channelId: string;
    authorId: string;
    content: string;
    fonte?: string;
    attachments: Attachment[];
    replyToId: string | null;
    mentions: string[];
    tipo?: "USER" | "JOIN" | "COMANDO";
    poll?: Prisma.PollCreateInput;
    stickerId?: string;
    postId?: string;
  }) {
    return prisma.message.create({ data, include: messageInclude });
  },

  update(id: string, data: Prisma.MessageUpdateInput) {
    return prisma.message.update({ where: { id }, data, include: messageInclude });
  },

  softDelete(id: string) {
    return prisma.message.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async softDeleteRecentByAuthor(guildId: string, authorId: string, desde: Date) {
    const canais = await prisma.channel.findMany({ where: { guildId }, select: { id: true } });

    const alvo = {
      authorId,
      channelId: { in: canais.map((c) => c.id) },
      createdAt: { gte: desde },
      ...notDeleted,
    };

    const comAnexo = await prisma.message.findMany({
      where: alvo,
      select: { attachments: true },
    });

    await prisma.message.updateMany({ where: alvo, data: { deletedAt: new Date() } });

    return comAnexo.flatMap((m) => m.attachments.map((a) => a.id));
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
    return prisma.reaction.findMany({
      where: { messageId },
      select: { emoji: true, userId: true, burst: true },
    });
  },

  add(messageId: string, userId: string, emoji: string, burst = false) {
    return prisma.reaction
      .upsert({
        where: { messageId_userId_emoji: { messageId, userId, emoji } },
        create: { messageId, userId, emoji, burst },
        update: burst ? { burst: true } : {},
      })
      .catch(() => undefined);
  },

  remove(messageId: string, userId: string, emoji: string) {
    return prisma.reaction
      .delete({ where: { messageId_userId_emoji: { messageId, userId, emoji } } })
      .catch(() => undefined);
  },
};

const idNoInstante = (quando: Date) =>
  Math.floor(quando.getTime() / 1000)
    .toString(16)
    .padStart(8, "0") + "0".repeat(16);

export const readStateRepository = {
  findManyByUser(userId: string) {
    return prisma.readState.findMany({ where: { userId } });
  },

  countUnread(channelId: string, afterMessageId: string) {
    return prisma.message.count({
      where: { channelId, id: { gt: afterMessageId } },
    });
  },

  countMentions(channelId: string, afterMessageId: string, userId: string, roleIds: string[]) {
    return prisma.message.count({
      where: {
        channelId,
        id: { gt: afterMessageId },
        authorId: { not: userId },
        OR: [
          { mentions: { has: userId } },
          { mentionEveryone: true },
          ...(roleIds.length ? [{ mentionRoleIds: { hasSome: roleIds } }] : []),
        ],
      },
    });
  },

  async mentionsSince(
    channelIds: string[],
    desde: Date,
    userId: string,
    roleIds: string[],
  ): Promise<Map<string, number>> {
    const porCanal = new Map<string, number>();
    if (!channelIds.length) return porCanal;

    const mensagens = await prisma.message.findMany({
      where: {
        channelId: { in: channelIds },
        id: { gt: idNoInstante(desde) },
        authorId: { not: userId },
        OR: [
          { mentions: { has: userId } },
          { mentionEveryone: true },
          ...(roleIds.length ? [{ mentionRoleIds: { hasSome: roleIds } }] : []),
        ],
      },
      select: { channelId: true },
    });

    for (const { channelId } of mensagens) {
      porCanal.set(channelId, (porCanal.get(channelId) ?? 0) + 1);
    }

    return porCanal;
  },

  async markRead(userId: string, channelId: string, messageId: string | null) {
    const oid = (v: string) => ({ $oid: v });

    await prisma.$runCommandRaw({
      update: "ReadState",
      updates: [
        {
          q: { userId: oid(userId), channelId: oid(channelId) },
          u: {
            $set: {
              lastReadMessageId: messageId ? oid(messageId) : null,
              mentionCount: 0,
              updatedAt: { $date: new Date().toISOString() },
            },
            $setOnInsert: { userId: oid(userId), channelId: oid(channelId) },
          },
          upsert: true,
        },
      ],
    });
  },
};

export const messageStatsRepository = {
  async byUserInChannels(userId: string, channelIds: string[]) {
    if (!channelIds.length) return { mensagens: 0, links: 0, midia: 0 };

    const base = { authorId: userId, channelId: { in: channelIds } };

    const [mensagens, links, midia] = await Promise.all([
      prisma.message.count({ where: base }),
      prisma.message.count({ where: { ...base, content: { contains: "http" } } }),
      prisma.message.count({ where: { ...base, attachments: { isEmpty: false } } }),
    ]);

    return { mensagens, links, midia };
  },

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
