import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

export const forumRepository = {
  /** Ordenado por atividade: assunto com resposta nova sobe pro topo. */
  findManyByChannel(channelId: string, params: { limit: number; before?: string }) {
    return prisma.forumPost.findMany({
      where: { channelId, ...(params.before ? { id: { lt: params.before } } : {}) },
      include: { author: true },
      orderBy: { lastMessageAt: "desc" },
      take: params.limit,
    });
  },

  findById(id: string) {
    return prisma.forumPost.findUnique({ where: { id }, include: { author: true } });
  },

  create(data: Prisma.ForumPostUncheckedCreateInput) {
    return prisma.forumPost.create({ data, include: { author: true } });
  },

  update(id: string, data: Prisma.ForumPostUpdateInput) {
    return prisma.forumPost.update({ where: { id }, data, include: { author: true } });
  },

  /** Uma resposta nova mexe em duas coisas ao mesmo tempo: contagem e ordem. */
  registrarResposta(id: string) {
    return prisma.forumPost.update({
      where: { id },
      data: { messageCount: { increment: 1 }, lastMessageAt: new Date() },
    });
  },

  remove(id: string) {
    return prisma.forumPost.delete({ where: { id } });
  },
};
