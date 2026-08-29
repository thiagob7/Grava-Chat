import type { Prisma, PresenceStatus } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

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
   * Acha uma pessoa pelo nome de usuário, para o pedido de amizade.
   *
   * ⚠️ O `isBot: false` aqui depende de o campo EXISTIR no documento.
   *
   * `@default(false)` no schema vale na ESCRITA: o Prisma não volta e preenche
   * quem já estava cadastrado quando o campo nasceu. E no conector do Mongo,
   * documento sem o campo não casa com `isBot: false` — nem com
   * `NOT: { isBot: true }`, que foi a primeira tentativa de conserto e falhou
   * pela mesma razão.
   *
   * Quem se cadastrou antes dos bots existirem ficava, portanto, impossível de
   * achar: a busca dizia "não achei ninguém com esse nome de usuário" como se a
   * pessoa tivesse errado a digitação. O conserto é no DADO, não na consulta —
   * `scripts/preencher-isbot.ts`.
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

export const noteRepository = {
  find(ownerId: string, targetId: string) {
    return prisma.userNote.findUnique({ where: { ownerId_targetId: { ownerId, targetId } } });
  },

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
