import type { OverwriteType, Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

export const roleRepository = {
  findManyByGuild(guildId: string) {
    return prisma.role.findMany({ where: { guildId }, orderBy: { position: "desc" } });
  },

  findById(id: string) {
    return prisma.role.findUnique({ where: { id } });
  },

  findEveryone(guildId: string) {
    return prisma.role.findFirst({ where: { guildId, isEveryone: true } });
  },

  async findForMember(guildId: string, roleIds: string[]) {
    return prisma.role.findMany({
      where: { guildId, OR: [{ id: { in: roleIds } }, { isEveryone: true }] },
    });
  },

  highestPosition(guildId: string) {
    return prisma.role.findFirst({
      where: { guildId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
  },

  create(data: Prisma.RoleUncheckedCreateInput) {
    return prisma.role.create({ data });
  },

  update(id: string, data: Prisma.RoleUpdateInput) {
    return prisma.role.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.role.delete({ where: { id } });
  },

  async countMembersByRole(guildId: string): Promise<Record<string, number>> {
    const membros = await prisma.guildMember.findMany({
      where: { guildId },
      select: { roleIds: true },
    });

    const contagem: Record<string, number> = {};
    for (const m of membros) {
      for (const id of m.roleIds) contagem[id] = (contagem[id] ?? 0) + 1;
    }

    return contagem;
  },

  membersWithRole(guildId: string, roleId: string) {
    return prisma.guildMember.findMany({
      where: { guildId, roleIds: { has: roleId } },
      include: { user: true },
    });
  },
};

export const overwriteRepository = {
  findManyByChannel(channelId: string) {
    return prisma.permissionOverwrite.findMany({ where: { channelId } });
  },

  findManyByChannels(channelIds: string[]) {
    return prisma.permissionOverwrite.findMany({ where: { channelId: { in: channelIds } } });
  },

  upsert(data: {
    channelId: string;
    targetId: string;
    type: OverwriteType;
    allow: string[];
    deny: string[];
  }) {
    return prisma.permissionOverwrite.upsert({
      where: { channelId_targetId: { channelId: data.channelId, targetId: data.targetId } },
      create: data,
      update: { allow: data.allow, deny: data.deny, type: data.type },
    });
  },

  remove(channelId: string, targetId: string) {
    return prisma.permissionOverwrite
      .delete({ where: { channelId_targetId: { channelId, targetId } } })
      .catch(() => undefined);
  },
};
