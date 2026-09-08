import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { ForbiddenError } from "~/lib/http.js";
import { ehAdmin } from "~/lib/serialize.js";
import { objectId } from "~/validations/common.js";
import { userRepository } from "~/repositories/user-repository.js";
import { sistemaService } from "~/services/sistema-service.js";

const comunicado = z.object({
  conteudo: z.string().trim().min(1).max(4000),
  /// Sem lista, vai para todo mundo. Com lista, só para quem está nela.
  userIds: z.array(objectId).max(10_000).optional(),
});

/*
  O que só a administração do app pode fazer.

  A permissão não é de servidor: é a lista de e-mails do `.env`. Quem não
  está nela recebe 403 antes de qualquer coisa acontecer.
*/
export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.addHook("preHandler", async (req) => {
    const user = await userRepository.findById(req.userId);
    if (!user || !ehAdmin(user.email)) throw new ForbiddenError("Só a administração do app");
  });

  app.get("/admin/pessoas", async () => {
    const total = await userRepository.contar();
    return { total };
  });

  app.post(
    "/admin/comunicados",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req) => {
      const { conteudo, userIds } = comunicado.parse(req.body);
      const destinos = userIds ?? (await userRepository.idsDeTodos());

      return sistemaService.comunicar(destinos, conteudo, req.log);
    },
  );
}
