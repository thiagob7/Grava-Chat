import type { Prisma, PresenceStatus } from "@prisma/client";
import { unset } from "~/lib/mongo.js";
import { prisma } from "~/lib/prisma.js";

export const userRepository = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  findByIdOrThrow(id: string) {
    return prisma.user.findUniqueOrThrow({ where: { id } });
  },

  count() {
    return prisma.user.count({ where: { isBot: false, ...unset("system") } });
  },

  async allIds(): Promise<string[]> {
    const lines = await prisma.user.findMany({
      where: { isBot: false, ...unset("system") },
      select: { id: true },
    });

    return lines.map((l) => l.id);
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username }, select: { id: true } });
  },

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

  async upsert(ownerId: string, targetId: string, text: string) {
    if (!text.trim()) {
      await prisma.userNote
        .delete({ where: { ownerId_targetId: { ownerId, targetId } } })
        .catch(() => undefined);

      return null;
    }

    return prisma.userNote.upsert({
      where: { ownerId_targetId: { ownerId, targetId } },
      create: { ownerId, targetId, text },
      update: { text },
    });
  },
};
