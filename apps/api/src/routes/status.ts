import os from "node:os";
import { readFile, statfs } from "node:fs/promises";
import type { FastifyInstance } from "fastify";

import { env } from "~/env.js";
import { prisma } from "~/lib/prisma.js";
import { redis } from "~/lib/redis.js";
import { io } from "~/realtime/io.js";
import { adminService } from "~/services/admin-service.js";
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

    const data = (await reply.json()) as Record<string, unknown>;
    return { ...readVoiceMachine(data), ms: Math.round(performance.now() - start) };
  } catch {
    return { unavailable: true };
  }
}

const numberFrom = (...values: unknown[]) => {
  for (const value of values) if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
};

const objectFrom = (value: unknown) => (value && typeof value === "object" ? (value as Record<string, unknown>) : {});

function readVoiceMachine(data: Record<string, unknown>): Omit<VoiceMachine, "ms"> {
  const load = objectFrom(data.carga);
  const memory = objectFrom(data.memoria);
  const disk = objectFrom(data.disk ?? data.disco);
  const livekit = objectFrom(data.livekit);

  return {
    host: typeof data.host === "string" ? data.host : "voz",
    cores: numberFrom(data.cores, data.nucleos) || 1,
    carga: {
      um: numberFrom(load.um, load.one),
      five: numberFrom(load.five, load.cinco),
      quinze: numberFrom(load.quinze, load.fifteen),
    },
    memoria: {
      total: numberFrom(memory.total),
      livre: numberFrom(memory.livre, memory.free),
      available: numberFrom(memory.available, memory.disponivel, memory.livre),
    },
    disk: { total: numberFrom(disk.total), livre: numberFrom(disk.livre, disk.free) },
    machineUptime: numberFrom(data.machineUptime, data.uptimeDaMaquina),
    livekit: {
      inAr: Boolean(livekit.inAr ?? livekit.noAr),
      resident: numberFrom(livekit.resident, livekit.residente),
    },
  };
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
    const token = req.headers["x-gravae-admin"];
    await adminService.require(req.userId, typeof token === "string" ? token : undefined, "servidor");

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
