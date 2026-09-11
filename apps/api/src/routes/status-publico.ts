import type { FastifyInstance } from "fastify";

import { env } from "~/env.js";
import { apiVersion } from "~/lib/versao.js";
import { DAYS_STORED, PIECES, statusService } from "~/services/status-service.js";

export async function statusPublicRoutes(app: FastifyInstance) {
  app.get("/publico/versao", async (_req, reply) => {
    void reply.header("Access-Control-Allow-Origin", "*");
    void reply.header("Cache-Control", "public, max-age=15, s-maxage=15");

    return {
      ...apiVersion,
      environment: env.WEB_ORIGIN.split(",")[0]?.trim() ?? null,
      sinceSeconds: Math.round(process.uptime()),
    };
  });

  app.get("/publico/status", async (_req, reply) => {
    const [now, appWindow] = await Promise.all([
      statusService.stateNow(),
      statusService.appWindow(),
    ]);

    void reply.header("Cache-Control", "public, max-age=30, s-maxage=30");

    void reply.header("Access-Control-Allow-Origin", "*");

    return {
      pieces: PIECES,
      now,
      appWindow,
      days: DAYS_STORED,
      em: new Date().toISOString(),
    };
  });
}
