import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

export const autoModRepository = {
  findManyByGuild(guildId: string) {
    return prisma.autoModRule.findMany({ where: { guildId }, orderBy: { createdAt: "asc" } });
  },

  findEnabledByGuild(guildId: string) {
    return prisma.autoModRule.findMany({ where: { guildId, enabled: true } });
  },

  findById(id: string) {
    return prisma.autoModRule.findUnique({ where: { id } });
  },

  create(data: Prisma.AutoModRuleUncheckedCreateInput) {
    return prisma.autoModRule.create({ data });
  },

  update(id: string, data: Prisma.AutoModRuleUpdateInput) {
    return prisma.autoModRule.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.autoModRule.delete({ where: { id } });
  },
};
