import type { Prisma, PresenceStatus } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

/**
 * Repository = único ponto de acesso ao banco para o agregado User.
 * Sem regra de negócio aqui — apenas queries Prisma.
 */
export const userRepository = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  findByIdOrThrow(id: string) {
    return prisma.user.findUniqueOrThrow({ where: { id } });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username }, select: { id: true } });
  },

  /**
   * Busca por nome de usuário, sem diferenciar maiúsculas. Bots ficam de fora:
   * webhook não aceita pedido de amizade, e achar um na busca só confundiria.
   */
  findByUsernamePublic(username: string) {
    return prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" }, isBot: false },
    });
  },

  findManyByIds(ids: string[]) {
    return prisma.user.findMany({ where: { id: { in: ids } } });
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  remove(id: string) {
    return prisma.user.delete({ where: { id } });
  },

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },

  /**
   * Atualização tolerante a conflito de escrita. Duas conexões do mesmo usuário
   * escrevendo no mesmo documento dão P2034 no Mongo; como este campo é apenas
   * cache (a verdade da presença é o Redis), falhar aqui não pode quebrar nada.
   */
  async updatePresenceCache(id: string, status: PresenceStatus) {
    await prisma.user
      .update({ where: { id }, data: { status, lastSeenAt: new Date() } })
      .catch((err: { code?: string }) => {
        if (err.code !== "P2034") throw err;
      });
  },

  setAllOffline() {
    return prisma.user.updateMany({
      where: { status: { not: "OFFLINE" } },
      data: { status: "OFFLINE" },
    });
  },
};
