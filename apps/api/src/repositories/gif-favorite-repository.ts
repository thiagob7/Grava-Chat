import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

export const gifFavoriteRepository = {
  findManyOf(userId: string) {
    return prisma.gifFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  upsert(data: Prisma.GifFavoriteUncheckedCreateInput) {
    const { userId, gifId, ...rest } = data;

    return prisma.gifFavorite.upsert({
      where: { userId_gifId: { userId, gifId } },
      create: { userId, gifId, ...rest },
      update: rest,
    });
  },

  deleteOne(userId: string, gifId: string) {
    return prisma.gifFavorite.deleteMany({ where: { userId, gifId } });
  },
};
