import type { FastifyInstance } from "fastify";
import { authService } from "~/services/auth-service.js";
import { messageService } from "~/services/message-service.js";
import { userRepository } from "~/repositories/user-repository.js";
import { toSelfUser } from "~/lib/serialize.js";
import { updateProfileInput } from "~/validations/auth.js";

export async function meRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/me", async (req) => {
    const [user, providers] = await Promise.all([
      authService.requireUser(req.userId),
      authService.providersOf(req.userId),
    ]);

    return toSelfUser(user, providers);
  });

  app.patch("/me", async (req) => {
    const body = updateProfileInput.parse(req.body);

    const [user, providers] = await Promise.all([
      userRepository.update(req.userId, body),
      authService.providersOf(req.userId),
    ]);

    return toSelfUser(user, providers);
  });

  /** Alimenta as bolinhas de não-lido. */
  app.get("/me/read-states", (req) => messageService.readStates(req.userId));
}
