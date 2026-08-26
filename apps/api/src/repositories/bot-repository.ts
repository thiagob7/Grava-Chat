import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

export const botRepository = {
  findManyOf(ownerId: string) {
    return prisma.bot.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      include: { usuario: true },
    });
  },

  findById(id: string) {
    return prisma.bot.findUnique({ where: { id }, include: { usuario: true } });
  },

  findByToken(token: string) {
    return prisma.bot.findUnique({ where: { token }, include: { usuario: true } });
  },

  /// Os bots por trás de uma lista de usuários-bot. É como se sai de "quem
  /// são os membros deste servidor" para "o que eles sabem fazer".
  findManyByUserIds(botUserIds: string[]) {
    return prisma.bot.findMany({
      where: { botUserId: { in: botUserIds } },
      include: { usuario: true },
    });
  },

  create(data: {
    ownerId: string;
    botUserId: string;
    token: string;
    clientSecret: string;
    permissoesPedidas: string[];
  }) {
    return prisma.bot.create({ data, include: { usuario: true } });
  },

  update(id: string, data: Prisma.BotUpdateInput) {
    return prisma.bot.update({ where: { id }, data, include: { usuario: true } });
  },

  updateToken(id: string, token: string) {
    return prisma.bot.update({ where: { id }, data: { token }, include: { usuario: true } });
  },

  delete(id: string) {
    return prisma.bot.delete({ where: { id } });
  },
};
