import { prisma } from "~/lib/prisma.js";

export const inviteRepository = {
  findByCode(code: string) {
    return prisma.invite.findUnique({ where: { code } });
  },

  findByCodeWithRelations(code: string) {
    return prisma.invite.findUnique({
      where: { code },
      include: {
        guild: { include: { _count: { select: { members: true } } } },
        inviter: true,
      },
    });
  },

  findManyByGuild(guildId: string) {
    return prisma.invite.findMany({
      where: { guildId },
      include: { inviter: true },
      orderBy: { createdAt: "desc" },
    });
  },

  remove(id: string) {
    return prisma.invite.delete({ where: { id } });
  },

  findById(id: string) {
    return prisma.invite.findUnique({ where: { id } });
  },

  create(data: {
    code: string;
    guildId: string;
    inviterId: string;
    maxUses: number | null;
    expiresAt: Date | null;
  }) {
    return prisma.invite.create({ data });
  },

  incrementUses(id: string) {
    return prisma.invite.update({ where: { id }, data: { uses: { increment: 1 } } });
  },
};
