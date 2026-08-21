import { prisma } from "~/lib/prisma.js";

export const banRepository = {
  findManyByGuild(guildId: string) {
    return prisma.ban.findMany({
      where: { guildId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
  },

  find(guildId: string, userId: string) {
    return prisma.ban.findUnique({ where: { guildId_userId: { guildId, userId } } });
  },

  create(data: { guildId: string; userId: string; moderatorId: string; reason?: string | null }) {
    return prisma.ban.create({ data, include: { user: true } });
  },

  remove(guildId: string, userId: string) {
    return prisma.ban.delete({ where: { guildId_userId: { guildId, userId } } });
  },
};
