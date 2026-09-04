import type { FastifyInstance } from "fastify";

import { DIAS_GUARDADOS, PECAS, statusService } from "~/services/status-service.js";

export async function statusPublicoRoutes(app: FastifyInstance) {
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
