import os from "node:os";
import { readFile, statfs } from "node:fs/promises";
import type { FastifyInstance } from "fastify";

import { env } from "~/env.js";
import { isAdmin } from "~/lib/serialize.js";
import { prisma } from "~/lib/prisma.js";
import { redis } from "~/lib/redis.js";
import { io } from "~/realtime/io.js";
import { authService } from "~/services/auth-service.js";
import { voiceService } from "~/services/voice-service.js";

async function measure(name: string, tarefa: () => Promise<unknown>) {
  const start = performance.now();

  try {
    await tarefa();
    return { name, state: "up" as const, ms: Math.round(performance.now() - start) };
  } catch {
    return { name, state: "down" as const, ms: Math.round(performance.now() - start) };
  }
}

async function memoria() {
  const total = os.totalmem();
  const livre = os.freemem();

  try {
    const meminfo = await readFile("/proc/meminfo", "utf8");
    const available = /MemAvailable:\s+(\d+) kB/.exec(meminfo);

    if (available) return { total, livre, available: Number(available[1]) * 1024 };
  } catch {
  }

  return { total, livre, available: livre };
}

async function disk() {
  try {
    const fs = await statfs("/");
    const total = Number(fs.blocks) * Number(fs.bsize);

    return { total, livre: Number(fs.bavail) * Number(fs.bsize) };
  } catch {
    return null;
  }
}

async function voiceMachine(): Promise<VoiceMachine | { unavailable: true } | null> {
  if (!env.SFU_STATUS_URL || !env.SFU_STATUS_TOKEN) return null;

  const start = performance.now();

  try {
    const reply = await fetch(env.SFU_STATUS_URL, {
      headers: { authorization: `Bearer ${env.SFU_STATUS_TOKEN}` },
      signal: AbortSignal.timeout(2_000),
    });

    if (!reply.ok) return { unavailable: true };

    const data = (await reply.json()) as Omit<VoiceMachine, "ms">;
    return { ...data, ms: Math.round(performance.now() - start) };
  } catch {
    return { unavailable: true };
  }
}

interface VoiceMachine {
  host: string;
  cores: number;
  carga: { um: number; five: number; quinze: number };
  memoria: { total: number; livre: number; available: number };
  disk: { total: number; livre: number };
  machineUptime: number;
  livekit: { inAr: boolean; resident: number };
  ms: number;
}

function gateway() {
  try {
    const server = io();
    const sockets = [...server.sockets.sockets.values()];

    return {
      connections: server.engine.clientsCount,
      people: new Set(sockets.filter((s) => !s.data.isBot).map((s) => s.data.userId)).size,
      bots: sockets.filter((s) => s.data.isBot).length,
    };
  } catch {
    return null;
  }
}

export async function statusRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/status", async (req, reply) => {
    const user = await authService.requireUser(req.userId);
    if (!isAdmin(user.email)) return reply.notFound();

    const [db, cache, rooms, ram, hd, voice] = await Promise.all([
      measure("mongo", () => prisma.$runCommandRaw({ ping: 1 })),
      measure("redis", () => redis.ping()),
      voiceService.sfuState().catch(() => null),
      memoria(),
      disk(),
      voiceMachine(),
    ]);

    const [c1, c5, c15] = os.loadavg();

    return {
      api: {
        host: os.hostname(),
        environment: env.NODE_ENV,
        carga: { um: c1, five: c5, quinze: c15 },
        cores: os.cpus().length,
        memoria: ram,
        resident: process.memoryUsage.rss(),
        disk: hd,
        processUptime: Math.round(process.uptime()),
        machineUptime: Math.round(os.uptime()),
        node: process.version,
      },
      gateway: gateway(),
      voice,
      mongo: db,
      redis: cache,
      sfu: rooms ?? {
        unavailable: true as const,
        rooms: [],
        participants: 0,
        publishing: 0,
        ghosts: [],
      },
    };
  });
}
