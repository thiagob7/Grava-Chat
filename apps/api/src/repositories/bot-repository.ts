import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

export const botRepository = {
  findManyOf(ownerId: string) {
    return prisma.bot.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
  },

  findPublic(search?: string, category?: string) {
    return prisma.bot.findMany({
      where: {
        isPublic: true,
        ...(search
          ? { user: { is: { displayName: { contains: search, mode: "insensitive" } } } }
          : {}),
        ...(category ? { categories: { has: category } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { user: true, owner: { select: { id: true, displayName: true } } },
    });
  },

  findPublicById(id: string) {
    return prisma.bot.findFirst({
      where: { id, isPublic: true },
      include: { user: true, owner: { select: { id: true, displayName: true } } },
    });
  },

  findById(id: string) {
    return prisma.bot.findUnique({ where: { id }, include: { user: true } });
  },

  findByToken(token: string) {
    return prisma.bot.findUnique({ where: { token }, include: { user: true } });
  },

  findManyByUserIds(botUserIds: string[]) {
    return prisma.bot.findMany({
      where: { botUserId: { in: botUserIds } },
      include: { user: true },
    });
  },

  create(data: {
    ownerId: string;
    botUserId: string;
    token: string;
    clientSecret: string;
    permissionsRequested: string[];
  }) {
    return prisma.bot.create({ data, include: { user: true } });
  },

  update(id: string, data: Prisma.BotUpdateInput) {
    return prisma.bot.update({ where: { id }, data, include: { user: true } });
  },

  updateToken(id: string, token: string) {
    return prisma.bot.update({ where: { id }, data: { token }, include: { user: true } });
  },

  delete(id: string) {
    return prisma.bot.delete({ where: { id } });
  },
};
