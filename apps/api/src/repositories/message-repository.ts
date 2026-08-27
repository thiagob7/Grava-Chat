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
  findById(id: string) {
    return prisma.message.findUnique({ where: { id } });
  },

  /// A mensagem imediatamente anterior no canal. O id do Mongo cresce com o
  /// tempo, que é o mesmo critério da paginação de mensagens.
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

  /**
   * A busca.
   *
   * `contains` sem índice de texto: com o tamanho de conversa que este app
   * tem, o Mongo varre e devolve rápido, e um índice de texto traria a briga
   * de idioma (radicais em português) para dentro de algo que ninguém pediu.
   * Se um dia doer, é aqui que entra o `$text`.
   */
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
    return prisma.reaction.findMany({
      where: { messageId },
      select: { emoji: true, userId: true, burst: true },
    });
  },

  /// Reagir de novo com o mesmo emoji, agora como super, promove a reação que
  /// já estava lá — a chave única impediria uma segunda linha, e sem o update
  /// o clique simplesmente não faria nada.
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

  /*
    Marcar como lido acontece em rajada: abrir vários canais, o bot despejando
    mensagens, duas abas do mesmo usuário. O `upsert` do Prisma no Mongo é
    leitura-e-escrita dentro de uma transação, então duas rajadas no MESMO
    documento colidem e o servidor devolve P2034 — que chegava na tela como
    "Erro inesperado", em série.

    A recomendação do próprio Prisma para P2034 é repetir. Aqui isso é seguro
    porque a operação é idempotente: o resultado de marcar lido duas vezes é o
    mesmo de marcar uma.
  */
  async markRead(userId: string, channelId: string, messageId: string | null) {
    for (let tentativa = 0; ; tentativa++) {
      try {
        return await prisma.readState.upsert({
          where: { userId_channelId: { userId, channelId } },
          create: { userId, channelId, lastReadMessageId: messageId, mentionCount: 0 },
          update: { lastReadMessageId: messageId, mentionCount: 0 },
        });
      } catch (erro) {
        const conflito =
          erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2034";

        if (!conflito || tentativa >= 3) throw erro;

        /// Espera crescente e curta: 20ms, 40ms, 80ms. O conflito dura o tempo
        /// da outra transação, que aqui é uma escrita de um documento só.
        await new Promise((r) => setTimeout(r, 20 * 2 ** tentativa));
      }
    }
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
