import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { themeService } from "~/services/tema-service.js";
import { objectId } from "~/validations/common.js";
import { publishThemeInput } from "~/validations/tema.js";

const params = z.object({ themeId: objectId });

export async function themeRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/temas", (req) => themeService.mine(req.userId));

  app.post("/temas", async (req, reply) => {
    const theme = await themeService.publish(req.userId, publishThemeInput.parse(req.body));
    return reply.status(201).send(theme);
  });

  app.get("/temas/:themeId", (req) => themeService.search(params.parse(req.params).themeId));

  app.delete("/temas/:themeId", async (req, reply) => {
    await themeService.doDelete(req.userId, params.parse(req.params).themeId);
    return reply.status(204).send();
  });
}
