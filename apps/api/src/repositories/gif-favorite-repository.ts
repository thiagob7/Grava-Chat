import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

export const gifFavoriteRepository = {
  findManyOf(userId: string) {
    return prisma.gifFavorito.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  upsert(data: Prisma.GifFavoritoUncheckedCreateInput) {
    const { userId, gifId, ...resto } = data;

    return prisma.gifFavorito.upsert({
      where: { userId_gifId: { userId, gifId } },
      create: { userId, gifId, ...resto },
      update: resto,
    });
  },

  deleteOne(userId: string, gifId: string) {
    return prisma.gifFavorito.deleteMany({ where: { userId, gifId } });
  },
};
