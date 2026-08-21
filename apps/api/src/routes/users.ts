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
}
