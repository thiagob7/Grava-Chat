import type { FastifyBaseLogger } from "fastify";

import { prisma } from "~/lib/prisma.js";

const INTERVAL_MS = 60 * 60 * 1000;

const DELAY_INITIAL_MS = 60_000;

const BY_ROUND = 20;

export const deletionService = {
  async purgeExpired(log?: FastifyBaseLogger) {
    const expired = await prisma.user.findMany({
      where: { deleteAt: { not: null, lte: new Date() } },
      select: { id: true, username: true },
      take: BY_ROUND,
    });

    if (!expired.length) return { deleted: 0, delayed: 0 };

    let deleted = 0;
    let delayed = 0;

    for (const account of expired) {
      const owner = await prisma.guild.findMany({
        where: { ownerId: account.id },
        select: { id: true, name: true, _count: { select: { members: true } } },
      });

      const withFolks = owner.filter((g) => g._count.members > 1);

      if (withFolks.length) {
        delayed++;
        log?.warn(
          { account: account.username, servers: withFolks.map((g) => g.name) },
          "exclusão adiada: a pessoa virou dona de servidor com outras pessoas durante o prazo",
        );
        continue;
      }

      try {
        await prisma.$transaction([
          prisma.guild.deleteMany({ where: { ownerId: account.id } }),

          prisma.webhook.deleteMany({ where: { createdById: account.id } }),

          prisma.user.delete({ where: { id: account.id } }),
        ]);

        deleted++;
        log?.info({ account: account.username }, "conta apagada — prazo vencido");
      } catch (error) {
        delayed++;
        log?.error({ err: error, account: account.username }, "não consegui apagar a conta");
      }
    }

    return { deleted, delayed };
  },

  watch(log?: FastifyBaseLogger) {
    const round = () => {
      void deletionService
        .purgeExpired(log)
        .then(({ deleted, delayed }) => {
          if (deleted || delayed) log?.info({ deleted, delayed }, "rodada de exclusão");
        })
        .catch((err) => log?.error({ err }, "rodada de exclusão falhou"));
    };

    const first = setTimeout(round, DELAY_INITIAL_MS);
    const clock = setInterval(round, INTERVAL_MS);

    first.unref();
    clock.unref();

    return () => {
      clearTimeout(first);
      clearInterval(clock);
    };
  },
};
