import type { FastifyInstance } from "fastify";
import { prisma } from "~/lib/prisma.js";
import { redis } from "~/lib/redis.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    const [db, cache] = await Promise.allSettled([
      prisma.$runCommandRaw({ ping: 1 }),
      redis.ping(),
    ]);

    return {
      ok: db.status === "fulfilled" && cache.status === "fulfilled",
      service: "gravae-api",
      mongo: db.status === "fulfilled" ? "up" : "down",
      redis: cache.status === "fulfilled" ? "up" : "down",
      uptime: Math.round(process.uptime()),
    };
  });
}
