import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { embedService } from "~/services/embed-service.js";

const consulta = z.object({ url: z.string().url().max(2048) });

export async function embedRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/embeds", async (req, reply) => {
    const { url } = consulta.parse(req.query);
    const embed = await embedService.resolver(url);

    reply.header("cache-control", "private, max-age=600");
    return { embed };
  });
}
