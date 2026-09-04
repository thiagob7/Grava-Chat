import { prisma } from "~/lib/prisma.js";

export const messageFavoriteRepository = {
  findManyOf(userId: string, limit: number) {
    return prisma.mensagemFavorita.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        message: { include: { author: true, reactions: true, sticker: true } },
      },
    });
  },

  idsOf(userId: string) {
    return prisma.mensagemFavorita.findMany({ where: { userId }, select: { messageId: true } });
  },

  add(userId: string, messageId: string) {
    return prisma.mensagemFavorita
      .create({ data: { userId, messageId } })
      .catch(() => undefined);
  },

  remove(userId: string, messageId: string) {
    return prisma.mensagemFavorita.deleteMany({ where: { userId, messageId } });
  },
};
