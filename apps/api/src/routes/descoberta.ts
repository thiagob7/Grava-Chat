import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { APP_CATEGORIES, rooms } from "@gravae/shared";

import { io } from "~/realtime/io.js";
import { botService } from "~/services/bot-service.js";
import {
  reportService,
  REPORT_REASONS,
} from "~/services/denuncia-service.js";
import { discoveryService } from "~/services/descoberta-service.js";
import { themeService } from "~/services/tema-service.js";
import { guildService } from "~/services/guild-service.js";
import { objectId } from "~/validations/common.js";

const filter = z.object({
  category: z.string().optional(),
  search: z.string().max(100).optional(),
});

const appsFilter = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.enum(APP_CATEGORIES).optional(),
});

const params = z.object({ guildId: objectId });

export async function discoveryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/descobrir", (req) => discoveryService.list(req.userId, filter.parse(req.query)));

  app.get("/descobrir/temas", (req) => themeService.gallery(filter.parse(req.query).search));

  app.get("/descobrir/aplicativos", (req) => {
    const query = appsFilter.parse(req.query);
    return botService.isPublic(query.search, query.category);
  });

  app.get("/descobrir/aplicativos/:botId", (req) => {
    const { botId } = z.object({ botId: objectId }).parse(req.params);
    return botService.isPublic(req.userId, botId);
  });

  app.post(
    "/descobrir/aplicativos/:botId/denuncias",
    { config: { rateLimit: { max: 5, timeWindow: "1 hour" } } },
    async (req, reply) => {
      const { botId } = z.object({ botId: objectId }).parse(req.params);
      const data = z
        .object({
          reason: z.enum(REPORT_REASONS),
          details: z.string().trim().max(1000).optional(),
        })
        .parse(req.body);

      await reportService.reportApp(req.userId, botId, data, req.log);

      return reply.status(201).send({ ok: true });
    },
  );

  app.post("/descobrir/:guildId/entrar", async (req) => {
    const { guildId } = params.parse(req.params);
    const result = await discoveryService.join(req.userId, guildId);

    if (result.member) {
      io().to(rooms.guild(guildId)).emit("member:joined", result.member);
      io().in(rooms.user(req.userId)).socketsJoin(rooms.guild(guildId));

      const greeting = await guildService.goodWelcome(guildId, req.userId);
      if (greeting) io().to(rooms.channel(greeting.channelId)).emit("message:created", greeting);
    }

    return { guildId, alreadyWasMember: result.alreadyWasMember };
  });
}
