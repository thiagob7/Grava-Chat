import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { temaService } from "~/services/tema-service.js";
import { objectId } from "~/validations/common.js";
import { publicarTemaInput } from "~/validations/tema.js";

const params = z.object({ temaId: objectId });

export async function temaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/temas", (req) => temaService.meus(req.userId));

  app.post("/temas", async (req, reply) => {
    const tema = await temaService.publicar(req.userId, publicarTemaInput.parse(req.body));
    return reply.status(201).send(tema);
  });

  app.get("/temas/:temaId", (req) => temaService.buscar(params.parse(req.params).temaId));

  app.delete("/temas/:temaId", async (req, reply) => {
    await temaService.apagar(req.userId, params.parse(req.params).temaId);
    return reply.status(204).send();
  });
}
