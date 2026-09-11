import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { ForbiddenError } from "~/lib/http.js";
import { isAdmin } from "~/lib/serialize.js";
import { objectId } from "~/validations/common.js";
import { userRepository } from "~/repositories/user-repository.js";
import { reportService } from "~/services/denuncia-service.js";
import { systemService } from "~/services/sistema-service.js";

const announcement = z.object({
  content: z.string().trim().min(1).max(4000),
  userIds: z.array(objectId).max(10_000).optional(),
});

const reportsQueue = z.object({
  pending: z.stringbool().optional(),
  before: objectId.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const outcome = z.object({ decision: z.enum(["procede", "arquivada", "reabrir"]) });

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.addHook("preHandler", async (req) => {
    const user = await userRepository.findById(req.userId);
    if (!user || !isAdmin(user.email)) throw new ForbiddenError("Só a administração do app");
  });

  app.get("/admin/pessoas", async () => {
    const total = await userRepository.count();
    return { total };
  });

  app.get("/admin/denuncias", (req) => {
    const { pending, before, limit } = reportsQueue.parse(req.query);

    return reportService.list({ pending, before, limit });
  });

  app.patch("/admin/denuncias/:reportId", (req) => {
    const { reportId } = z.object({ reportId: objectId }).parse(req.params);
    const { decision } = outcome.parse(req.body);

    return decision === "reabrir"
      ? reportService.reopen(reportId)
      : reportService.resolve(req.userId, reportId, decision);
  });

  app.post(
    "/admin/comunicados",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req) => {
      const { content, userIds } = announcement.parse(req.body);
      const destinations = userIds ?? (await userRepository.allIds());

      return systemService.announce(destinations, content, req.log);
    },
  );
}
