import type { FastifyInstance } from "fastify";
import { rooms, objectId } from "@gravae/shared";
import { io } from "~/realtime/io.js";
import { auditService } from "~/services/audit-service.js";
import { autoModCrud } from "~/services/automod-crud.js";
import { moderationService } from "~/services/moderation-service.js";
import { guildParams, guildMemberParams } from "~/validations/common.js";
import {
  auditQuery,
  autoModRuleInput,
  banInput,
  nicknameInput,
  timeoutInput,
} from "~/validations/moderation.js";

const ruleParams = guildParams.extend({ ruleId: objectId });

export async function moderationRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/guilds/:guildId/audit-log", (req) => {
    const { guildId } = guildParams.parse(req.params);
    return auditService.list(req.userId, guildId, auditQuery.parse(req.query));
  });

  app.get("/guilds/:guildId/bans", (req) => {
    const { guildId } = guildParams.parse(req.params);
    return moderationService.listBans(req.userId, guildId);
  });

  app.put("/guilds/:guildId/bans/:userId", async (req) => {
    const { guildId, userId } = guildMemberParams.parse(req.params);
    const ban = await moderationService.ban(req.userId, guildId, userId, banInput.parse(req.body ?? {}));

    io().to(rooms.guild(guildId)).emit("member:left", { guildId, userId });
    io().in(rooms.user(userId)).socketsLeave(rooms.guild(guildId));

    return ban;
  });

  app.delete("/guilds/:guildId/bans/:userId", async (req, reply) => {
    const { guildId, userId } = guildMemberParams.parse(req.params);
    await moderationService.unban(req.userId, guildId, userId);

    return reply.code(204).send();
  });

  app.put("/guilds/:guildId/members/:userId/timeout", async (req) => {
    const { guildId, userId } = guildMemberParams.parse(req.params);
    const member = await moderationService.castigar(
      req.userId,
      guildId,
      userId,
      timeoutInput.parse(req.body),
    );

    io().to(rooms.guild(guildId)).emit("member:updated", member);
    return member;
  });

  app.patch("/guilds/:guildId/members/:userId/nickname", async (req) => {
    const { guildId, userId } = guildMemberParams.parse(req.params);
    const { nickname } = nicknameInput.parse(req.body);
    const member = await moderationService.apelidar(req.userId, guildId, userId, nickname);

    io().to(rooms.guild(guildId)).emit("member:updated", member);
    return member;
  });

  app.get("/guilds/:guildId/automod", (req) => {
    const { guildId } = guildParams.parse(req.params);
    return autoModCrud.list(req.userId, guildId);
  });

  app.post("/guilds/:guildId/automod", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const regra = await autoModCrud.create(req.userId, guildId, autoModRuleInput.parse(req.body));

    return reply.code(201).send(regra);
  });

  app.patch("/guilds/:guildId/automod/:ruleId", (req) => {
    const { guildId, ruleId } = ruleParams.parse(req.params);
    return autoModCrud.update(req.userId, guildId, ruleId, autoModRuleInput.partial().parse(req.body));
  });

  app.delete("/guilds/:guildId/automod/:ruleId", async (req, reply) => {
    const { guildId, ruleId } = ruleParams.parse(req.params);
    await autoModCrud.remove(req.userId, guildId, ruleId);

    return reply.code(204).send();
  });
}
