import { prisma } from "~/lib/prisma.js";

export const messageFavoriteRepository = {
  /**
   * Sem filtrar pela relação. `where: { message: { deletedAt: null } }` volta
   * VAZIO no Mongo mesmo com a mensagem lá e o campo em null — é a mesma
   * armadilha do `campo: null` que já mordeu o projeto, agora atravessando uma
   * relação. Quem descarta a mensagem apagada é o service, em memória.
   */
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
