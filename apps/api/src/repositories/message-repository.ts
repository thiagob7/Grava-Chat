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
  findMentions(userId: string, channelIds: string[], since: Date) {
    return prisma.message.findMany({
      where: {
        ...notDeleted,
        channelId: { in: channelIds },
        mentions: { has: userId },
        authorId: { not: userId },
        createdAt: { gte: since },
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
      where: { channelId, ...notDeleted, id: { lt: messageId } },
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

  search(params: {
    channelIds: string[];
    term: string;
    authorId?: string;
    mentionsId?: string;
    channelId?: string;
    has?: "link" | "imagem" | "video" | "som" | "arquivo" | "anexo";
    after?: string;
    until?: string;
    em?: string;
    pinned?: boolean;
    authorKind?: "usuario" | "bot";
    order: "recente" | "antiga";
    limit: number;
    before?: string;
  }) {
    const channels = params.channelId
      ? params.channelIds.filter((id) => id === params.channelId)
      : params.channelIds;

    if (!channels.length) return Promise.resolve([]);

    const start = (day: string) => new Date(`${day}T00:00:00.000Z`);
    const end = (day: string) => new Date(`${day}T23:59:59.999Z`);

    const byKind = (prefix: string): Prisma.MessageWhereInput => ({
      attachments: { some: { contentType: { startsWith: prefix } } },
    });

    const has: Prisma.MessageWhereInput =
      params.has === "link"
        ? { content: { contains: "http" } }
        : params.has === "imagem"
          ? byKind("image/")
          : params.has === "video"
            ? byKind("video/")
            : params.has === "som"
              ? byKind("audio/")
              : params.has === "arquivo" || params.has === "anexo"
                ? { attachments: { isEmpty: false } }
                : {};

    const when: Prisma.MessageWhereInput = params.em
      ? { createdAt: { gte: start(params.em), lte: end(params.em) } }
      : {
          createdAt: {
            ...(params.after ? { gte: start(params.after) } : {}),
            ...(params.until ? { lte: end(params.until) } : {}),
          },
        };

    const old = params.order === "antiga";

    return prisma.message.findMany({
      where: {
        channelId: { in: channels },
        ...(params.term ? { content: { contains: params.term, mode: "insensitive" } } : {}),
        ...(params.authorId ? { authorId: params.authorId } : {}),
        ...(params.mentionsId ? { mentions: { has: params.mentionsId } } : {}),
        ...(params.pinned === true ? { pinnedAt: { not: null } } : {}),
        ...(params.pinned === false ? { pinnedAt: null } : {}),
        ...(params.authorKind ? { author: { isBot: params.authorKind === "bot" } } : {}),
        ...(params.before ? { id: old ? { gt: params.before } : { lt: params.before } } : {}),
        AND: [notDeleted, has, when],
      },
      include: { ...messageInclude, channel: true },
      orderBy: { id: old ? "asc" : "desc" },
      take: params.limit,
    });
  },

  create(data: {
    channelId: string;
    authorId: string;
    content: string;
    font?: string;
    attachments: Attachment[];
    replyToId: string | null;
    channelForwardedId?: string | null;
    messageForwardedId?: string | null;
    mentions: string[];
    kind?: "USER" | "JOIN" | "COMANDO";
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

  async softDeleteRecentByAuthor(guildId: string, authorId: string, since: Date) {
    const channels = await prisma.channel.findMany({ where: { guildId }, select: { id: true } });

    const target = {
      authorId,
      channelId: { in: channels.map((c) => c.id) },
      createdAt: { gte: since },
      ...notDeleted,
    };

    const withAttachment = await prisma.message.findMany({
      where: target,
      select: { attachments: true },
    });

    await prisma.message.updateMany({ where: target, data: { deletedAt: new Date() } });

    return withAttachment.flatMap((m) => m.attachments.map((a) => a.id));
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

  findManyByMessageWithUser(messageId: string) {
    return prisma.reaction.findMany({
      where: { messageId },
      orderBy: { createdAt: "asc" },
      include: { user: true },
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

const idInstant = (when: Date) =>
  Math.floor(when.getTime() / 1000)
    .toString(16)
    .padStart(8, "0") + "0".repeat(16);

export const readStateRepository = {
  findLastIn(channelId: string) {
    return prisma.message.findFirst({
      where: { channelId, ...notDeleted },
      orderBy: { id: "desc" },
      select: { id: true },
    });
  },

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
    since: Date,
    userId: string,
    roleIds: string[],
  ): Promise<Map<string, number>> {
    const byChannel = new Map<string, number>();
    if (!channelIds.length) return byChannel;

    const messages = await prisma.message.findMany({
      where: {
        channelId: { in: channelIds },
        id: { gt: idInstant(since) },
        authorId: { not: userId },
        OR: [
          { mentions: { has: userId } },
          { mentionEveryone: true },
          ...(roleIds.length ? [{ mentionRoleIds: { hasSome: roleIds } }] : []),
        ],
      },
      select: { channelId: true },
    });

    for (const { channelId } of messages) {
      byChannel.set(channelId, (byChannel.get(channelId) ?? 0) + 1);
    }

    return byChannel;
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
    if (!channelIds.length) return { messages: 0, links: 0, media: 0 };

    const base = { authorId: userId, channelId: { in: channelIds } };

    const [messages, links, media] = await Promise.all([
      prisma.message.count({ where: base }),
      prisma.message.count({ where: { ...base, content: { contains: "http" } } }),
      prisma.message.count({ where: { ...base, attachments: { isEmpty: false } } }),
    ]);

    return { messages, links, media };
  },

  findByUserInChannels(params: {
    userId: string;
    channelIds: string[];
    filter: "todas" | "links" | "midia";
    limit: number;
    before?: string;
  }) {
    if (!params.channelIds.length) return Promise.resolve([]);

    return prisma.message.findMany({
      where: {
        authorId: params.userId,
        channelId: { in: params.channelIds },
        ...(params.filter === "links" ? { content: { contains: "http" } } : {}),
        ...(params.filter === "midia" ? { attachments: { isEmpty: false } } : {}),
        ...(params.before ? { id: { lt: params.before } } : {}),
      },
      include: { author: true, channel: true },
      orderBy: { createdAt: "desc" },
      take: params.limit,
    });
  },
};
