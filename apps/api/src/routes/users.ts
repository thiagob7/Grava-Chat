import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { objectId } from "@gravae/shared";
import { profileService } from "~/services/profile-service.js";

export async function userRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/users/:userId", (req) => {
    const { userId } = z.object({ userId: objectId }).parse(req.params);
    return profileService.view(req.userId, userId);
  });

  /**
   * A anotação privada sobre alguém. PUT e não PATCH: o corpo é o texto
   * inteiro, e mandar vazio é a forma de apagar.
   */
  app.put("/users/:userId/nota", (req) => {
    const { userId } = z.object({ userId: objectId }).parse(req.params);
    const { texto } = z.object({ texto: z.string().max(256) }).parse(req.body);

    return profileService.anotar(req.userId, userId, texto);
  });
}
