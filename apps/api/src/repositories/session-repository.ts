import { prisma } from "~/lib/prisma.js";
import { unset } from "~/lib/mongo.js";

export const sessionRepository = {
  findByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ip?: string;
  }) {
    return prisma.refreshToken.create({ data });
  },

  async claimForRotation(id: string) {
    const result = await prisma.refreshToken.updateMany({
      where: { id, AND: [unset("supersededAt"), unset("revokedAt")] },
      data: { supersededAt: new Date() },
    });

    return result.count > 0;
  },

  revoke(tokenHash: string) {
    return prisma.refreshToken
      .update({ where: { tokenHash }, data: { revokedAt: new Date() } })
      .catch(() => undefined);
  },

  revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, ...unset("revokedAt") },
      data: { revokedAt: new Date() },
    });
  },
};
