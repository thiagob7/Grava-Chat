import type { FastifyBaseLogger } from "fastify";

import { prisma } from "~/lib/prisma.js";
import { redis } from "~/lib/redis.js";
import { voiceService } from "~/services/voice-service.js";

export const PIECES = ["api", "banco", "cache", "sfu"] as const;
export type Piece = (typeof PIECES)[number];

const INTERVAL_MS = 60_000;

const DELAY_INITIAL_MS = 15_000;

export const DAYS_STORED = 90;

export interface Measure {
  piece: Piece;
  state: "up" | "down";
  ms: number;
}

export const dayUtc = (when = new Date()) => when.toISOString().slice(0, 10);

async function measure(piece: Piece, tarefa: () => Promise<unknown>): Promise<Measure> {
  const start = performance.now();

  try {
    await tarefa();
    return { piece, state: "up", ms: Math.round(performance.now() - start) };
  } catch {
    return { piece, state: "down", ms: Math.round(performance.now() - start) };
  }
}

export async function stateNow(): Promise<Measure[]> {
  const [banco, cache, sfu] = await Promise.all([
    measure("banco", () => prisma.$runCommandRaw({ ping: 1 })),
    measure("cache", () => redis.ping()),
    measure("sfu", async () => {
      const state = await voiceService.sfuState();
      if (!state) throw new Error("sfu não respondeu");
    }),
  ]);

  return [{ piece: "api", state: "up", ms: 0 }, banco, cache, sfu];
}

async function record(measures: Measure[]): Promise<void> {
  const day = dayUtc();

  await Promise.all(
    measures.map((m) =>
      prisma.dayStatus.upsert({
        where: { piece_day: { piece: m.piece, day } },
        create: {
          piece: m.piece,
          day,
          measures: 1,
          failures: m.state === "down" ? 1 : 0,
          msSoma: m.ms,
        },
        update: {
          measures: { increment: 1 },
          failures: { increment: m.state === "down" ? 1 : 0 },
          msSoma: { increment: m.ms },
        },
      }),
    ),
  );
}

async function prune(): Promise<number> {
  const limit = new Date(Date.now() - DAYS_STORED * 24 * 60 * 60 * 1000);
  const { count } = await prisma.dayStatus.deleteMany({
    where: { day: { lt: dayUtc(limit) } },
  });

  return count;
}

export const statusService = {
  stateNow,

  async appWindow(): Promise<Record<Piece, { day: string; uptime: number | null }[]>> {
    const start = new Date(Date.now() - (DAYS_STORED - 1) * 24 * 60 * 60 * 1000);

    const records = await prisma.dayStatus.findMany({
      where: { day: { gte: dayUtc(start) } },
    });

    const byKey = new Map(records.map((r) => [`${r.piece}|${r.day}`, r]));
    const output = {} as Record<Piece, { day: string; uptime: number | null }[]>;

    for (const piece of PIECES) {
      output[piece] = Array.from({ length: DAYS_STORED }, (_, i) => {
        const day = dayUtc(new Date(start.getTime() + i * 24 * 60 * 60 * 1000));
        const record = byKey.get(`${piece}|${day}`);

        if (!record?.measures) return { day, uptime: null };

        const good = record.measures - record.failures;
        return { day, uptime: Math.round((good / record.measures) * 10000) / 100 };
      });
    }

    return output;
  },

  watch(log?: FastifyBaseLogger) {
    const round = () => {
      void stateNow()
        .then(async (measures) => {
          await record(measures);

          const fallen = measures.filter((m) => m.state === "down").map((m) => m.piece);
          if (fallen.length) log?.warn({ fallen }, "peças fora do ar");
        })
        .catch((err) => log?.error({ err }, "rodada de status falhou"));
    };

    const cleanup = () => {
      void prune()
        .then((deleted) => deleted && log?.info({ deleted }, "dias de status podados"))
        .catch((err) => log?.error({ err }, "poda de status falhou"));
    };

    const first = setTimeout(round, DELAY_INITIAL_MS);
    const clock = setInterval(round, INTERVAL_MS);
    const cleaner = setInterval(cleanup, 60 * 60 * 1000);

    first.unref();
    clock.unref();
    cleaner.unref();

    return () => {
      clearTimeout(first);
      clearInterval(clock);
      clearInterval(cleaner);
    };
  },
};
