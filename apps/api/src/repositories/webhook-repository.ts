import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

const withBot = { bot: true, createdBy: true } satisfies Prisma.WebhookInclude;

export const webhookRepository = {
  findManyByGuild(guildId: string) {
    return prisma.webhook.findMany({
      where: { guildId },
      include: withBot,
      orderBy: { createdAt: "asc" },
    });
  },

  findById(id: string) {
    return prisma.webhook.findUnique({ where: { id }, include: withBot });
  },

  create(data: Prisma.WebhookUncheckedCreateInput) {
    return prisma.webhook.create({ data, include: withBot });
  },

  update(id: string, data: Prisma.WebhookUpdateInput) {
    return prisma.webhook.update({ where: { id }, data, include: withBot });
  },

  remove(id: string) {
    return prisma.webhook.delete({ where: { id } });
  },
};
