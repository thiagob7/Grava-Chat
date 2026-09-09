import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { ForbiddenError } from "~/lib/http.js";
import { ehAdmin } from "~/lib/serialize.js";
import { objectId } from "~/validations/common.js";
import { userRepository } from "~/repositories/user-repository.js";
import { denunciaService } from "~/services/denuncia-service.js";
import { sistemaService } from "~/services/sistema-service.js";

const comunicado = z.object({
  conteudo: z.string().trim().min(1).max(4000),
  userIds: z.array(objectId).max(10_000).optional(),
});

const filaDeDenuncias = z.object({
  pendentes: z.stringbool().optional(),
  antesDe: objectId.optional(),
  limite: z.coerce.number().int().min(1).max(100).optional(),
});

const desfecho = z.object({ decisao: z.enum(["procede", "arquivada", "reabrir"]) });

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

  app.get("/admin/denuncias", (req) => {
    const { pendentes, antesDe, limite } = filaDeDenuncias.parse(req.query);

    return denunciaService.listar({ pendentes, antesDe, limite });
  });

  app.patch("/admin/denuncias/:denunciaId", (req) => {
    const { denunciaId } = z.object({ denunciaId: objectId }).parse(req.params);
    const { decisao } = desfecho.parse(req.body);

    return decisao === "reabrir"
      ? denunciaService.reabrir(denunciaId)
      : denunciaService.resolver(req.userId, denunciaId, decisao);
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
