import type { FastifyBaseLogger } from "fastify";

import { prisma } from "~/lib/prisma.js";

const INTERVALO_MS = 60 * 60 * 1000;

const ATRASO_INICIAL_MS = 60_000;

const POR_RODADA = 20;

export const exclusaoService = {
  async purgarVencidas(log?: FastifyBaseLogger) {
    const vencidas = await prisma.user.findMany({
      where: { excluirEm: { not: null, lte: new Date() } },
      select: { id: true, username: true },
      take: POR_RODADA,
    });

    if (!vencidas.length) return { apagadas: 0, adiadas: 0 };

    let apagadas = 0;
    let adiadas = 0;

    for (const conta of vencidas) {
      const donaDe = await prisma.guild.findMany({
        where: { ownerId: conta.id },
        select: { id: true, name: true, _count: { select: { members: true } } },
      });

      const comGente = donaDe.filter((g) => g._count.members > 1);

      if (comGente.length) {
        adiadas++;
        log?.warn(
          { conta: conta.username, servidores: comGente.map((g) => g.name) },
          "exclusão adiada: a pessoa virou dona de servidor com outras pessoas durante o prazo",
        );
        continue;
      }

      try {
        await prisma.$transaction([
          prisma.guild.deleteMany({ where: { ownerId: conta.id } }),

          prisma.webhook.deleteMany({ where: { createdById: conta.id } }),

          prisma.user.delete({ where: { id: conta.id } }),
        ]);

        apagadas++;
        log?.info({ conta: conta.username }, "conta apagada — prazo vencido");
      } catch (erro) {
        adiadas++;
        log?.error({ err: erro, conta: conta.username }, "não consegui apagar a conta");
      }
    }

    return { apagadas, adiadas };
  },

  vigiar(log?: FastifyBaseLogger) {
    const rodada = () => {
      void exclusaoService
        .purgarVencidas(log)
        .then(({ apagadas, adiadas }) => {
          if (apagadas || adiadas) log?.info({ apagadas, adiadas }, "rodada de exclusão");
        })
        .catch((err) => log?.error({ err }, "rodada de exclusão falhou"));
    };

    const primeira = setTimeout(rodada, ATRASO_INICIAL_MS);
    const relogio = setInterval(rodada, INTERVALO_MS);

    primeira.unref();
    relogio.unref();

    return () => {
      clearTimeout(primeira);
      clearInterval(relogio);
    };
  },
};
