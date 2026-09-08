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

  /*
    Os bots que qualquer um pode adicionar. Bot fechado só entra em servidor
    do próprio dono, então não tem por que aparecer na vitrine de ninguém.
  */
  findPublicos(busca?: string) {
    return prisma.bot.findMany({
      where: {
        publico: true,
        ...(busca
          ? { usuario: { is: { displayName: { contains: busca, mode: "insensitive" } } } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { usuario: true, owner: { select: { id: true, displayName: true } } },
    });
  },

  findById(id: string) {
    return prisma.bot.findUnique({ where: { id }, include: { usuario: true } });
  },

  findByToken(token: string) {
    return prisma.bot.findUnique({ where: { token }, include: { usuario: true } });
  },

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
