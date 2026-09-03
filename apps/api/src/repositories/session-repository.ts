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

  /*
    As sessões vivas de uma pessoa, da mais recente pra mais antiga.

    Viva = não revogada, não substituída e não vencida. As três condições
    importam: um token substituído por rotação normal ainda está na tabela, e
    listá-lo mostraria dois "aparelhos" onde só há um — o de antes e o de
    depois do último refresh.
  */
  findAtivasForUser(userId: string) {
    return prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
        AND: [unset("revokedAt"), unset("supersededAt")],
      },
      select: { id: true, userAgent: true, ip: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    });
  },

  /// Revoga UMA sessão, conferindo que ela é de quem pediu. Sem o `userId` no
  /// filtro, um id vazado derrubaria a sessão de outra pessoa.
  async revokeById(userId: string, id: string) {
    const result = await prisma.refreshToken.updateMany({
      where: { id, userId, ...unset("revokedAt") },
      data: { revokedAt: new Date() },
    });

    return result.count > 0;
  },

  revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, ...unset("revokedAt") },
      data: { revokedAt: new Date() },
    });
  },
};
