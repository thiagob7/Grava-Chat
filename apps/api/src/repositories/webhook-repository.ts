import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

const comBot = { bot: true, createdBy: true } satisfies Prisma.WebhookInclude;

export const webhookRepository = {
  findManyByGuild(guildId: string) {
    return prisma.webhook.findMany({
      where: { guildId },
      include: comBot,
      orderBy: { createdAt: "asc" },
    });
  },

  findById(id: string) {
    return prisma.webhook.findUnique({ where: { id }, include: comBot });
  },

  create(data: Prisma.WebhookUncheckedCreateInput) {
    return prisma.webhook.create({ data, include: comBot });
  },

  update(id: string, data: Prisma.WebhookUpdateInput) {
    return prisma.webhook.update({ where: { id }, data, include: comBot });
  },

  remove(id: string) {
    return prisma.webhook.delete({ where: { id } });
  },
};
