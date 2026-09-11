import type { FastifyInstance } from "fastify";
import { LIMITS, rooms } from "@gravae/shared";
import { botService } from "~/services/bot-service.js";
import { reportService, REPORT_REASONS } from "~/services/denuncia-service.js";
import { guildEventService } from "~/services/guild-event-service.js";
import { guildService } from "~/services/guild-service.js";
import { messageService } from "~/services/message-service.js";
import { badgeService } from "~/services/emblema-service.js";
import { io } from "~/realtime/io.js";
import {
  guildParams,
  guildChannelParams,
  guildMemberParams,
} from "~/validations/common.js";
import { z } from "zod";
import { objectId } from "@gravae/shared";
import {
  guildEventInput,
  createGuildInput,
  createChannelInput,
  updateChannelInput,
  createCategoryInput,
  createInviteInput,
  updateGuildInput,
  createBadgeInput,
} from "~/validations/guild.js";

export async function guildRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/guilds", (req) => guildService.listForUser(req.userId));

  app.post("/guilds", async (req, reply) => {
    const guild = await guildService.create(req.userId, createGuildInput.parse(req.body));
    return reply.code(201).send(guild);
  });

  app.get("/guilds/:guildId", (req) => {
    const { guildId } = guildParams.parse(req.params);
    return guildService.detail(req.userId, guildId);
  });

  app.post(
    "/guilds/:guildId/denuncias",
    { config: { rateLimit: { max: 3, timeWindow: "1 hour" } } },
    async (req, reply) => {
      const { guildId } = guildParams.parse(req.params);
      const data = z
        .object({
          reason: z.enum(REPORT_REASONS),
          details: z.string().trim().max(1000).optional(),
        })
        .parse(req.body);

      const result = await reportService.reportServer(req.userId, guildId, data, req.log);
      return reply.code(201).send(result);
    },
  );

  app.get("/guilds/:guildId/events", (req) => {
    const { guildId } = guildParams.parse(req.params);
    return guildEventService.list(req.userId, guildId);
  });

  app.post("/guilds/:guildId/events", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const event = await guildEventService.create(req.userId, guildId, guildEventInput.parse(req.body));

    io().to(rooms.guild(guildId)).emit("event:updated", { guildId });
    return reply.code(201).send(event);
  });

  app.patch("/guilds/:guildId/events/:eventId", async (req) => {
    const { guildId } = guildParams.parse(req.params);
    const { eventId } = z.object({ eventId: objectId }).parse(req.params);

    const event = await guildEventService.update(req.userId, guildId, eventId, guildEventInput.parse(req.body));

    io().to(rooms.guild(guildId)).emit("event:updated", { guildId });
    return event;
  });

  app.delete("/guilds/:guildId/events/:eventId", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const { eventId } = z.object({ eventId: objectId }).parse(req.params);

    await guildEventService.cancel(req.userId, guildId, eventId);

    io().to(rooms.guild(guildId)).emit("event:updated", { guildId });
    return reply.code(204).send();
  });

  app.put("/guilds/:guildId/events/:eventId/interest", async (req) => {
    const { guildId } = guildParams.parse(req.params);
    const { eventId } = z.object({ eventId: objectId }).parse(req.params);
    const { interested } = z.object({ interested: z.boolean() }).parse(req.body);

    const result = await guildEventService.setInterest(req.userId, guildId, eventId, interested);

    io().to(rooms.guild(guildId)).emit("event:updated", { guildId });
    return result;
  });

  app.post("/guilds/:guildId/lidas", async (req) => {
    const { guildId } = guildParams.parse(req.params);
    return messageService.markServerRead(req.userId, guildId);
  });

  app.put("/guilds/:guildId/verificacao", async (req) => {
    const { guildId } = guildParams.parse(req.params);
    const { verified } = z.object({ verified: z.boolean() }).parse(req.body);

    return guildService.verify(req.userId, guildId, verified);
  });

  app.patch("/guilds/:guildId", async (req) => {
    const { guildId } = guildParams.parse(req.params);
    const guild = await guildService.update(req.userId, guildId, updateGuildInput.parse(req.body));

    io().to(rooms.guild(guildId)).emit("guild:updated", guild);
    return guild;
  });

  app.get("/guilds/:guildId/comunidade", (req) => {
    const { guildId } = guildParams.parse(req.params);
    return guildService.communityState(req.userId, guildId);
  });

  app.post("/guilds/:guildId/comunidade", async (req) => {
    const { guildId } = guildParams.parse(req.params);

    const data = z
      .object({
        verifiedRequiresEmail: z.boolean(),
        filtersMediaExplicit: z.boolean(),
        rulesChannelId: objectId.nullable(),
        noticesChannelId: objectId.nullable(),
        languagePrincipal: z.string().max(16).nullable(),
      })
      .parse(req.body);

    const state = await guildService.enableCommunity(req.userId, guildId, data);
    const detail = await guildService.detail(req.userId, guildId);

    io().to(rooms.guild(guildId)).emit("guild:updated", detail.guild);
    return state;
  });

  app.patch("/guilds/:guildId/comunidade", async (req) => {
    const { guildId } = guildParams.parse(req.params);

    const data = z
      .object({
        verifiedRequiresEmail: z.boolean().optional(),
        filtersMediaExplicit: z.boolean().optional(),
        rulesChannelId: objectId.nullable().optional(),
        noticesChannelId: objectId.nullable().optional(),
        securityChannelId: objectId.nullable().optional(),
        languagePrincipal: z.string().max(16).nullable().optional(),
      })
      .parse(req.body);

    return guildService.adjustCommunity(req.userId, guildId, data);
  });

  app.get("/guilds/:guildId/comandos", async (req) => {
    const { guildId } = guildParams.parse(req.params);
    await guildService.detail(req.userId, guildId);

    return botService.serverCommands(guildId);
  });

  app.get("/guilds/:guildId/invites", (req) => {
    const { guildId } = guildParams.parse(req.params);
    return guildService.listInvites(req.userId, guildId);
  });

  app.delete("/guilds/:guildId/invites/:inviteId", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const { inviteId } = z.object({ inviteId: objectId }).parse(req.params);

    await guildService.removeInvite(req.userId, guildId, inviteId);
    return reply.code(204).send();
  });

  app.post("/guilds/:guildId/channels", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const channel = await guildService.createChannel(
      req.userId,
      guildId,
      createChannelInput.parse(req.body),
    );

    io().to(rooms.guild(guildId)).emit("channel:created", channel);
    return reply.code(201).send(channel);
  });

  app.patch("/guilds/:guildId/channels/:channelId", async (req) => {
    const { guildId, channelId } = guildChannelParams.parse(req.params);
    const channel = await guildService.updateChannel(
      req.userId,
      guildId,
      channelId,
      updateChannelInput.parse(req.body),
    );

    io().to(rooms.guild(guildId)).emit("channel:updated", channel);
    return channel;
  });

  app.put("/guilds/:guildId/channels/:channelId/status", async (req) => {
    const { guildId, channelId } = guildChannelParams.parse(req.params);
    const { status } = z
      .object({ status: z.string().max(LIMITS.channelStatus).nullable() })
      .parse(req.body);

    const channel = await guildService.setChannelStatus(req.userId, guildId, channelId, status);

    io().to(rooms.guild(guildId)).emit("channel:updated", channel);
    return channel;
  });

  app.delete("/guilds/:guildId/channels/:channelId", async (req, reply) => {
    const { guildId, channelId } = guildChannelParams.parse(req.params);
    await guildService.deleteChannel(req.userId, guildId, channelId);

    io().to(rooms.guild(guildId)).emit("channel:deleted", { channelId, guildId });
    return reply.code(204).send();
  });

  app.post("/guilds/:guildId/categories", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const { name } = createCategoryInput.parse(req.body);

    return reply.code(201).send(await guildService.createCategory(req.userId, guildId, name));
  });

  app.post("/guilds/:guildId/invites", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const invite = await guildService.createInvite(
      req.userId,
      guildId,
      createInviteInput.parse(req.body ?? {}),
    );

    return reply.code(201).send(invite);
  });

  app.get("/guilds/:guildId/preview", (req) => {
    const { guildId } = guildParams.parse(req.params);
    return guildService.preview(req.userId, guildId);
  });

  app.get("/guilds/:guildId/emblemas", (req) => {
    const { guildId } = guildParams.parse(req.params);
    return badgeService.list(req.userId, guildId);
  });

  app.post("/guilds/:guildId/emblemas", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const badge = await badgeService.create(
      req.userId,
      guildId,
      createBadgeInput.parse(req.body),
    );

    io().to(rooms.guild(guildId)).emit("guild:refresh", { guildId });
    return reply.code(201).send(badge);
  });

  app.delete("/guilds/:guildId/emblemas/:badgeId", async (req, reply) => {
    const { guildId, badgeId } = z
      .object({ guildId: objectId, badgeId: objectId })
      .parse(req.params);

    await badgeService.remove(req.userId, guildId, badgeId);

    io().to(rooms.guild(guildId)).emit("guild:refresh", { guildId });
    return reply.code(204).send();
  });

  app.put("/guilds/:guildId/members/@me/emblemas", async (req) => {
    const { guildId } = guildParams.parse(req.params);
    const { emblemIds } = z.object({ emblemIds: z.array(objectId) }).parse(req.body);

    const result = await badgeService.wear(req.userId, guildId, emblemIds);

    io().to(rooms.guild(guildId)).emit("guild:refresh", { guildId });
    return result;
  });

  app.delete("/guilds/:guildId", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const members = await guildService.remove(req.userId, guildId);

    io().to(rooms.guild(guildId)).emit("guild:deleted", { guildId });
    io().in(rooms.guild(guildId)).socketsLeave(rooms.guild(guildId));
    void members;

    return reply.code(204).send();
  });

  app.get("/guilds/:guildId/members/:userId/moderation", (req) => {
    const { guildId, userId } = guildMemberParams.parse(req.params);
    return guildService.moderationView(req.userId, guildId, userId);
  });

  app.get("/guilds/:guildId/members/:userId/messages", (req) => {
    const { guildId, userId } = guildMemberParams.parse(req.params);
    const { filter, before } = z
      .object({
        filter: z.enum(["todas", "links", "midia"]).default("todas"),
        before: objectId.optional(),
      })
      .parse(req.query);

    return guildService.moderationMessages(req.userId, guildId, userId, filter, before);
  });

  app.delete("/guilds/:guildId/members/:userId", async (req, reply) => {
    const { guildId, userId } = guildMemberParams.parse(req.params);
    await guildService.removeMember(req.userId, guildId, userId);

    io().to(rooms.guild(guildId)).emit("member:left", { guildId, userId });
    io().in(rooms.user(userId)).socketsLeave(rooms.guild(guildId));

    return reply.code(204).send();
  });
}
