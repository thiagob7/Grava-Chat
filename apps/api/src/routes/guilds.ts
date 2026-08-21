import type { FastifyInstance } from "fastify";
import { rooms } from "@gravae/shared";
import { guildService } from "~/services/guild-service.js";
import { io } from "~/realtime/io.js";
import {
  guildParams,
  guildChannelParams,
  guildMemberParams,
} from "~/validations/common.js";
import { z } from "zod";
import { objectId } from "@gravae/shared";
import {
  createGuildInput,
  createChannelInput,
  updateChannelInput,
  createCategoryInput,
  createInviteInput,
  updateGuildInput,
} from "~/validations/guild.js";

/**
 * Controller fino: valida a entrada, chama o service, publica o evento de
 * tempo real. Nenhuma regra de negócio e nenhum Prisma aqui.
 */
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

  app.patch("/guilds/:guildId", async (req) => {
    const { guildId } = guildParams.parse(req.params);
    const guild = await guildService.update(req.userId, guildId, updateGuildInput.parse(req.body));

    // nome e ícone aparecem na barra lateral de todo mundo
    io().to(rooms.guild(guildId)).emit("guild:updated", guild);
    return guild;
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

  app.delete("/guilds/:guildId", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const membros = await guildService.remove(req.userId, guildId);

    // avisa quem estava lá e tira todo mundo da sala, senão eles continuam
    // recebendo eventos de um servidor que não existe mais
    io().to(rooms.guild(guildId)).emit("guild:deleted", { guildId });
    io().in(rooms.guild(guildId)).socketsLeave(rooms.guild(guildId));
    void membros;

    return reply.code(204).send();
  });

  app.delete("/guilds/:guildId/members/:userId", async (req, reply) => {
    const { guildId, userId } = guildMemberParams.parse(req.params);
    await guildService.removeMember(req.userId, guildId, userId);

    io().to(rooms.guild(guildId)).emit("member:left", { guildId, userId });
    io().in(rooms.user(userId)).socketsLeave(rooms.guild(guildId));

    return reply.code(204).send();
  });
}
