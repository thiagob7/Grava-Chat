import os from "node:os";
import { readFile, statfs } from "node:fs/promises";
import type { FastifyInstance } from "fastify";

import { env } from "~/env.js";
import { ehAdmin } from "~/lib/serialize.js";
import { prisma } from "~/lib/prisma.js";
import { redis } from "~/lib/redis.js";
import { io } from "~/realtime/io.js";
import { authService } from "~/services/auth-service.js";
import { voiceService } from "~/services/voice-service.js";

async function medir(nome: string, tarefa: () => Promise<unknown>) {
  const comeco = performance.now();

  try {
    await tarefa();
    return { nome, estado: "up" as const, ms: Math.round(performance.now() - comeco) };
  } catch {
    return { nome, estado: "down" as const, ms: Math.round(performance.now() - comeco) };
  }
}

async function memoria() {
  const total = os.totalmem();
  const livre = os.freemem();

  try {
    const meminfo = await readFile("/proc/meminfo", "utf8");
    const disponivel = /MemAvailable:\s+(\d+) kB/.exec(meminfo);

    if (disponivel) return { total, livre, disponivel: Number(disponivel[1]) * 1024 };
  } catch {
    /* não é Linux, ou /proc não está montado: o número do os já serve */
  }

  return { total, livre, disponivel: livre };
}

async function disco() {
  try {
    const fs = await statfs("/");
    const total = Number(fs.blocks) * Number(fs.bsize);

    return { total, livre: Number(fs.bavail) * Number(fs.bsize) };
  } catch {
    return null;
  }
}

async function maquinaDeVoz(): Promise<MaquinaDeVoz | { indisponivel: true } | null> {
  if (!env.SFU_STATUS_URL || !env.SFU_STATUS_TOKEN) return null;

  const comeco = performance.now();

  try {
    const resposta = await fetch(env.SFU_STATUS_URL, {
      headers: { authorization: `Bearer ${env.SFU_STATUS_TOKEN}` },
      signal: AbortSignal.timeout(2_000),
    });

    if (!resposta.ok) return { indisponivel: true };

    const dados = (await resposta.json()) as Omit<MaquinaDeVoz, "ms">;
    return { ...dados, ms: Math.round(performance.now() - comeco) };
  } catch {
    return { indisponivel: true };
  }
}

interface MaquinaDeVoz {
  host: string;
  nucleos: number;
  carga: { um: number; cinco: number; quinze: number };
  memoria: { total: number; livre: number; disponivel: number };
  disco: { total: number; livre: number };
  uptimeDaMaquina: number;
  livekit: { noAr: boolean; residente: number };
  ms: number;
}

function gateway() {
  try {
    const servidor = io();
    const sockets = [...servidor.sockets.sockets.values()];

    return {
      conexoes: servidor.engine.clientsCount,
      pessoas: new Set(sockets.filter((s) => !s.data.ehBot).map((s) => s.data.userId)).size,
      bots: sockets.filter((s) => s.data.ehBot).length,
    };
  } catch {
    return null;
  }
}

export async function statusRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/status", async (req, reply) => {
    const user = await authService.requireUser(req.userId);
    if (!ehAdmin(user.email)) return reply.notFound();

    const [db, cache, salas, ram, hd, voz] = await Promise.all([
      medir("mongo", () => prisma.$runCommandRaw({ ping: 1 })),
      medir("redis", () => redis.ping()),
      voiceService.estadoDoSfu().catch(() => null),
      memoria(),
      disco(),
      maquinaDeVoz(),
    ]);

    const [c1, c5, c15] = os.loadavg();

    return {
      api: {
        host: os.hostname(),
        ambiente: env.NODE_ENV,
        carga: { um: c1, cinco: c5, quinze: c15 },
        nucleos: os.cpus().length,
        memoria: ram,
        residente: process.memoryUsage.rss(),
        disco: hd,
        uptimeDoProcesso: Math.round(process.uptime()),
        uptimeDaMaquina: Math.round(os.uptime()),
        node: process.version,
      },
      gateway: gateway(),
      voz,
      mongo: db,
      redis: cache,
      sfu: salas ?? {
        indisponivel: true as const,
        salas: [],
        participantes: 0,
        publicando: 0,
        fantasmas: [],
      },
    };
  });
}
