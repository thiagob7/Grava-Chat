import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  APP_CATEGORIES,
  CATEGORIES_LIMIT,
  LANGUAGES_LIMIT,
  rooms,
} from "@gravae/shared";

import { io } from "~/realtime/io.js";
import { botService } from "~/services/bot-service.js";
import { objectId } from "~/validations/common.js";

const botParams = z.object({ botId: objectId });
const botServer = z.object({ botId: objectId, guildId: objectId });
const createBody = z.object({ name: z.string().trim().min(2).max(32) });

const editBody = z.object({
  name: z.string().trim().min(2).max(32).optional(),
  description: z.string().trim().max(300).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  categories: z.array(z.enum(APP_CATEGORIES)).max(CATEGORIES_LIMIT).optional(),
  languages: z.array(z.string().max(10)).max(LANGUAGES_LIMIT).optional(),
  termsUrl: z.string().url().nullable().optional(),
  policyUrl: z.string().url().nullable().optional(),
  supportServerId: objectId.nullable().optional(),
  permissionsRequested: z.array(z.string().max(40)).max(40).optional(),
  isPublic: z.boolean().optional(),
  redirectUris: z.array(z.string().url()).max(10).optional(),
});

export async function botRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/bots", (req) => botService.list(req.userId));

  app.post("/bots", (req) => botService.create(req.userId, createBody.parse(req.body).name));

  app.patch("/bots/:botId", (req) =>
    botService.edit(req.userId, botParams.parse(req.params).botId, editBody.parse(req.body)),
  );

  app.post("/bots/:botId/token", (req) =>
    botService.regenerateToken(req.userId, botParams.parse(req.params).botId),
  );

  app.delete("/bots/:botId", async (req, reply) => {
    await botService.doDelete(req.userId, botParams.parse(req.params).botId);
    return reply.status(204).send();
  });

  app.get("/bots/:botId/convite", (req) =>
    botService.forInvite(botParams.parse(req.params).botId),
  );

  app.get("/bots/:botId/destinos", (req) =>
    botService.destinationsFor(req.userId, botParams.parse(req.params).botId),
  );

  app.get("/bots/:botId/servidores", (req) =>
    botService.servers(botParams.parse(req.params).botId),
  );

  const notifyCommands = (guildId: string) =>
    io().to(rooms.guild(guildId)).emit("commands:changed", { guildId });

  app.put("/bots/:botId/servidores/:guildId", async (req) => {
    const { botId, guildId } = botServer.parse(req.params);
    const entry = await botService.addServer(req.userId, botId, guildId);

    notifyCommands(guildId);
    return entry;
  });

  app.delete("/bots/:botId/servidores/:guildId", async (req, reply) => {
    const { botId, guildId } = botServer.parse(req.params);
    await botService.removeServer(req.userId, botId, guildId);

    notifyCommands(guildId);
    return reply.status(204).send();
  });
}
