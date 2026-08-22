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

/**
 * A anotacao privada que voce faz sobre outra pessoa.
 *
 * Repositorio separado do `userRepository` de proposito: o dono do dado nao e o
 * usuario descrito, e sim quem escreveu. Misturar os dois convidaria alguem a
 * incluir a nota num `select` de perfil e vazar o que uma pessoa anotou sobre
 * a outra.
 */
export const noteRepository = {
  find(ownerId: string, targetId: string) {
    return prisma.userNote.findUnique({ where: { ownerId_targetId: { ownerId, targetId } } });
  },

  /** Texto vazio APAGA: nota em branco e ausencia de nota, nao uma nota vazia. */
  async upsert(ownerId: string, targetId: string, texto: string) {
    if (!texto.trim()) {
      await prisma.userNote
        .delete({ where: { ownerId_targetId: { ownerId, targetId } } })
        .catch(() => undefined);

      return null;
    }

    return prisma.userNote.upsert({
      where: { ownerId_targetId: { ownerId, targetId } },
      create: { ownerId, targetId, texto },
      update: { texto },
    });
  },
};
