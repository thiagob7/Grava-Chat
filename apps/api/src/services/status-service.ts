import type { FastifyBaseLogger } from "fastify";

import { prisma } from "~/lib/prisma.js";
import { redis } from "~/lib/redis.js";
import { voiceService } from "~/services/voice-service.js";

export const PECAS = ["api", "banco", "cache", "sfu"] as const;
export type Peca = (typeof PECAS)[number];

const INTERVALO_MS = 60_000;

const ATRASO_INICIAL_MS = 15_000;

export const DIAS_GUARDADOS = 90;

export interface Medida {
  peca: Peca;
  estado: "up" | "down";
  ms: number;
}

export const diaUtc = (quando = new Date()) => quando.toISOString().slice(0, 10);

async function medir(peca: Peca, tarefa: () => Promise<unknown>): Promise<Medida> {
  const comeco = performance.now();

  try {
    await tarefa();
    return { peca, estado: "up", ms: Math.round(performance.now() - comeco) };
  } catch {
    return { peca, estado: "down", ms: Math.round(performance.now() - comeco) };
  }
}

export async function estadoAgora(): Promise<Medida[]> {
  const [banco, cache, sfu] = await Promise.all([
    medir("banco", () => prisma.$runCommandRaw({ ping: 1 })),
    medir("cache", () => redis.ping()),
    medir("sfu", async () => {
      const estado = await voiceService.estadoDoSfu();
      if (!estado) throw new Error("sfu não respondeu");
    }),
  ]);

  return [{ peca: "api", estado: "up", ms: 0 }, banco, cache, sfu];
}

async function gravar(medidas: Medida[]): Promise<void> {
  const dia = diaUtc();

  await Promise.all(
    medidas.map((m) =>
      prisma.statusDoDia.upsert({
        where: { peca_dia: { peca: m.peca, dia } },
        create: {
          peca: m.peca,
          dia,
          medidas: 1,
          falhas: m.estado === "down" ? 1 : 0,
          msSoma: m.ms,
        },
        update: {
          medidas: { increment: 1 },
          falhas: { increment: m.estado === "down" ? 1 : 0 },
          msSoma: { increment: m.ms },
        },
      }),
    ),
  );
}

async function podar(): Promise<number> {
  const limite = new Date(Date.now() - DIAS_GUARDADOS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.statusDoDia.deleteMany({
    where: { dia: { lt: diaUtc(limite) } },
  });

  return count;
}

export const statusService = {
  estadoAgora,

  async janela(): Promise<Record<Peca, { dia: string; uptime: number | null }[]>> {
    const inicio = new Date(Date.now() - (DIAS_GUARDADOS - 1) * 24 * 60 * 60 * 1000);

    const registros = await prisma.statusDoDia.findMany({
      where: { dia: { gte: diaUtc(inicio) } },
    });

    const porChave = new Map(registros.map((r) => [`${r.peca}|${r.dia}`, r]));
    const saida = {} as Record<Peca, { dia: string; uptime: number | null }[]>;

    for (const peca of PECAS) {
      saida[peca] = Array.from({ length: DIAS_GUARDADOS }, (_, i) => {
        const dia = diaUtc(new Date(inicio.getTime() + i * 24 * 60 * 60 * 1000));
        const registro = porChave.get(`${peca}|${dia}`);

        if (!registro?.medidas) return { dia, uptime: null };

        const bons = registro.medidas - registro.falhas;
        return { dia, uptime: Math.round((bons / registro.medidas) * 10000) / 100 };
      });
    }

    return saida;
  },

  vigiar(log?: FastifyBaseLogger) {
    const rodada = () => {
      void estadoAgora()
        .then(async (medidas) => {
          await gravar(medidas);

          const caidas = medidas.filter((m) => m.estado === "down").map((m) => m.peca);
          if (caidas.length) log?.warn({ caidas }, "peças fora do ar");
        })
        .catch((err) => log?.error({ err }, "rodada de status falhou"));
    };

    const limpeza = () => {
      void podar()
        .then((apagados) => apagados && log?.info({ apagados }, "dias de status podados"))
        .catch((err) => log?.error({ err }, "poda de status falhou"));
    };

    const primeira = setTimeout(rodada, ATRASO_INICIAL_MS);
    const relogio = setInterval(rodada, INTERVALO_MS);
    const faxina = setInterval(limpeza, 60 * 60 * 1000);

    primeira.unref();
    relogio.unref();
    faxina.unref();

    return () => {
      clearTimeout(primeira);
      clearInterval(relogio);
      clearInterval(faxina);
    };
  },
};
