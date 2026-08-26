import { prisma } from "~/lib/prisma.js";

export const accountRepository = {
  findByProvider(provider: string, providerAccountId: string) {
    return prisma.account.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    });
  },

  findManyByUser(userId: string) {
    return prisma.account.findMany({ where: { userId }, select: { provider: true } });
  },

  create(data: { userId: string; provider: string; providerAccountId: string }) {
    return prisma.account.create({ data });
  },
};
