import type { FastifyInstance } from "fastify";

import { env } from "~/env.js";
import { versaoDaApi } from "~/lib/versao.js";
import { DIAS_GUARDADOS, PECAS, statusService } from "~/services/status-service.js";

export async function statusPublicoRoutes(app: FastifyInstance) {
  app.get("/publico/versao", async (_req, reply) => {
    void reply.header("Access-Control-Allow-Origin", "*");
    void reply.header("Cache-Control", "public, max-age=15, s-maxage=15");

    return {
      ...versaoDaApi,
      ambiente: env.WEB_ORIGIN.split(",")[0]?.trim() ?? null,
      desdeSegundos: Math.round(process.uptime()),
    };
  });

  app.get("/publico/status", async (_req, reply) => {
    const [agora, janela] = await Promise.all([
      statusService.estadoAgora(),
      statusService.janela(),
    ]);

    void reply.header("Cache-Control", "public, max-age=30, s-maxage=30");

    void reply.header("Access-Control-Allow-Origin", "*");

    return {
      pecas: PECAS,
      agora,
      janela,
      dias: DIAS_GUARDADOS,
      em: new Date().toISOString(),
    };
  });
}
