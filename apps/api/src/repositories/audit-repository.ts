import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

export const auditRepository = {
  create(data: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.auditLog.create({ data });
  },

  findPage(params: { guildId: string; actorId?: string; action?: string; limit: number; before?: string }) {
    return prisma.auditLog.findMany({
      where: {
        guildId: params.guildId,
        ...(params.actorId ? { actorId: params.actorId } : {}),
        // "role" pega role.create, role.update e role.delete de uma vez
        ...(params.action ? { action: { startsWith: params.action } } : {}),
        ...(params.before ? { id: { lt: params.before } } : {}),
      },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: params.limit,
    });
  },
};
