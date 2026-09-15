import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  setCommandsInput,
  botEditMessageInput,
  botSendMessageInput,
  interactionCallbackInput,
  rooms,
} from "@gravae/shared";

import { AppError, ForbiddenError, UnauthorizedError } from "~/lib/http.js";
import { baseUrlDe } from "~/lib/endereco.js";
import { toPublicUser } from "~/lib/serialize.js";
import {
  deleteMessage,
  editEphemeral,
  editMessage,
  sendEphemeral,
  sendMessage,
  react,
} from "~/realtime/difusao.js";
import { io } from "~/realtime/io.js";
import { channelRepository, memberRepository } from "~/repositories/guild-repository.js";
import { accessService } from "~/services/access-service.js";
import { botService } from "~/services/bot-service.js";
import { guildService } from "~/services/guild-service.js";
import { messageService } from "~/services/message-service.js";
import { moderationService } from "~/services/moderation-service.js";
import { roleService } from "~/services/role-service.js";
import { objectId } from "~/validations/common.js";
import { banInput, nicknameInput, timeoutInput } from "~/validations/moderation.js";
import { auditService } from "~/services/audit-service.js";
import { expressionService } from "~/services/expression-service.js";
import { webhookService } from "~/services/webhook-service.js";
import { interactionService } from "~/services/interaction-service.js";
import { createEmojiInput, updateEmojiInput } from "~/validations/expression.js";
import { createChannelInput, updateChannelInput, updateGuildInput } from "~/validations/guild.js";
import { auditQuery } from "~/validations/moderation.js";
import {
  createRoleInput,
  reorderRolesInput,
  setMemberRolesInput,
  updateRoleInput,
} from "~/validations/role.js";
import { createWebhookInput } from "~/validations/webhook.js";
import { setOverwriteInput } from "~/validations/role.js";
import { syncGuildRooms } from "~/realtime/room-sync.js";

const guildParams = z.object({ guildId: objectId });
const channelParams = z.object({ channelId: objectId });
const messageParams = z.object({ messageId: objectId });


const overwriteParams = guildParams.extend({ channelId: objectId, targetId: objectId });

const interactionParams = z.object({ interactionId: z.uuid(), token: z.string().min(1).max(128) });

const reactionParams = messageParams.extend({ emoji: z.string().min(1).max(80) });
const reactionBody = z.object({ burst: z.boolean().optional() });

const memberParams = guildParams.extend({ userId: objectId });
const serverParamsChannel = guildParams.extend({ channelId: objectId });
const roleParams = guildParams.extend({ roleId: objectId });
const emojiParams = guildParams.extend({ emojiId: objectId });

const inviteBody = z.object({
  maxUses: z.number().int().min(1).max(1000).nullable().optional(),
  expiresInHours: z.number().int().min(1).max(24 * 365).nullable().optional(),
});

const historyQuery = z.object({
  before: objectId.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

async function botDoToken(req: FastifyRequest) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bot ")) throw new UnauthorizedError("Falta o token do bot");

  const owner = await botService.resolveToken(header.slice(4).trim());
  if (!owner) throw new UnauthorizedError("Token de bot inválido");

  return owner;
}

async function requirePresence(botUserId: string, guildId: string) {
  const member = await memberRepository.find(guildId, botUserId);
  if (!member) throw new ForbiddenError("Esse bot não está nesse servidor");
}

const notifyPermissionChange = (guildId: string) => {
  io().to(rooms.guild(guildId)).emit("guild:refresh", { guildId });
  void syncGuildRooms(guildId).catch(() => undefined);
};

export async function botApiRoutes(app: FastifyInstance) {
  app.get("/bot/eu", async (req) => {
    const { botId, userId } = await botDoToken(req);
    return { botId, userId };
  });

  app.get("/bot/servidores", async (req) => {
    const { botId } = await botDoToken(req);
    return botService.servers(botId);
  });

  app.get("/bot/servidores/:guildId/canais", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    await requirePresence(userId, guildId);

    const [channels, readable] = await Promise.all([
      channelRepository.findManyByGuild(guildId),
      accessService.readableChannels(userId, guildId, { withHistory: false }),
    ]);
    const visible = new Set(readable);

    return channels.filter((c) => visible.has(c.id)).map((c) => ({ id: c.id, name: c.name, type: c.type }));
  });

  app.get("/bot/servidores/:guildId/membros", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    await requirePresence(userId, guildId);

    const members = await memberRepository.findManyByGuild(guildId);

    return members.map((m) => ({
      userId: m.userId,
      nickname: m.nickname,
      roleIds: m.roleIds,
      joinedAt: m.joinedAt,
      user: toPublicUser(m.user),
    }));
  });

  app.get("/bot/servidores/:guildId/cargos", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    return roleService.list(userId, guildId);
  });

  app.patch("/bot/servidores/:guildId/membros/:userId/apelido", async (req) => {
    const { userId: botUserId } = await botDoToken(req);
    const { guildId, userId: target } = memberParams.parse(req.params);
    const { nickname } = nicknameInput.parse(req.body);

    return moderationService.nickname(botUserId, guildId, target, nickname);
  });

  app.put("/bot/servidores/:guildId/membros/:userId/cargos", async (req) => {
    const { userId: botUserId } = await botDoToken(req);
    const { guildId, userId: target } = memberParams.parse(req.params);

    return roleService.setMemberRoles(botUserId, guildId, target, setMemberRolesInput.parse(req.body));
  });

  app.delete("/bot/servidores/:guildId/membros/:userId", async (req, reply) => {
    const { userId: botUserId } = await botDoToken(req);
    const { guildId, userId: target } = memberParams.parse(req.params);

    await guildService.removeMember(botUserId, guildId, target);

    return reply.status(204).send();
  });

  app.put("/bot/servidores/:guildId/castigos/:userId", async (req) => {
    const { userId: botUserId } = await botDoToken(req);
    const { guildId, userId: target } = memberParams.parse(req.params);

    return moderationService.timeout(botUserId, guildId, target, timeoutInput.parse(req.body));
  });

  app.get("/bot/servidores/:guildId/banimentos", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    return moderationService.listBans(userId, guildId);
  });

  app.put("/bot/servidores/:guildId/banimentos/:userId", async (req) => {
    const { userId: botUserId } = await botDoToken(req);
    const { guildId, userId: target } = memberParams.parse(req.params);

    return moderationService.ban(botUserId, guildId, target, banInput.parse(req.body ?? {}));
  });

  app.delete("/bot/servidores/:guildId/banimentos/:userId", async (req, reply) => {
    const { userId: botUserId } = await botDoToken(req);
    const { guildId, userId: target } = memberParams.parse(req.params);

    await moderationService.unban(botUserId, guildId, target);

    return reply.status(204).send();
  });

  app.post("/bot/servidores/:guildId/canais", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    const channel = await guildService.createChannel(userId, guildId, createChannelInput.parse(req.body));

    return reply.status(201).send(channel);
  });

  app.patch("/bot/servidores/:guildId/canais/:channelId", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId, channelId } = serverParamsChannel.parse(req.params);

    return guildService.updateChannel(userId, guildId, channelId, updateChannelInput.parse(req.body));
  });

  app.delete("/bot/servidores/:guildId/canais/:channelId", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { guildId, channelId } = serverParamsChannel.parse(req.params);

    await guildService.deleteChannel(userId, guildId, channelId);

    return reply.status(204).send();
  });

  app.post("/bot/servidores/:guildId/convites", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    const invite = await guildService.createInvite(userId, guildId, inviteBody.parse(req.body ?? {}));

    return reply.status(201).send(invite);
  });

  app.patch("/bot/servidores/:guildId", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    return guildService.update(userId, guildId, updateGuildInput.parse(req.body));
  });

  app.get("/bot/servidores/:guildId/auditoria", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    return auditService.list(userId, guildId, auditQuery.parse(req.query));
  });

  app.post("/bot/servidores/:guildId/cargos", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    const role = await roleService.create(userId, guildId, createRoleInput.parse(req.body));

    return reply.status(201).send(role);
  });

  app.patch("/bot/servidores/:guildId/cargos/:roleId", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId, roleId } = roleParams.parse(req.params);

    return roleService.update(userId, guildId, roleId, updateRoleInput.parse(req.body));
  });

  app.delete("/bot/servidores/:guildId/cargos/:roleId", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { guildId, roleId } = roleParams.parse(req.params);

    await roleService.remove(userId, guildId, roleId);

    return reply.status(204).send();
  });

  app.put("/bot/servidores/:guildId/cargos", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    return roleService.reorder(userId, guildId, reorderRolesInput.parse(req.body));
  });

  app.get("/bot/servidores/:guildId/expressoes", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    return expressionService.list(userId, guildId);
  });

  app.post("/bot/servidores/:guildId/emojis", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    const emoji = await expressionService.createEmoji(userId, guildId, createEmojiInput.parse(req.body));

    return reply.status(201).send(emoji);
  });

  app.patch("/bot/servidores/:guildId/emojis/:emojiId", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId, emojiId } = emojiParams.parse(req.params);
    const { name } = updateEmojiInput.parse(req.body);

    return expressionService.renameEmoji(userId, guildId, emojiId, name);
  });

  app.delete("/bot/servidores/:guildId/emojis/:emojiId", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { guildId, emojiId } = emojiParams.parse(req.params);

    await expressionService.removeEmoji(userId, guildId, emojiId);

    return reply.status(204).send();
  });

  app.get("/bot/servidores/:guildId/webhooks", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    return webhookService.list(userId, guildId, baseUrlDe(req));
  });

  app.post("/bot/servidores/:guildId/webhooks", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    const webhook = await webhookService.create(
      userId,
      guildId,
      createWebhookInput.parse(req.body),
      baseUrlDe(req),
    );

    return reply.status(201).send(webhook);
  });

  app.put("/bot/guilds/:guildId/channels/:channelId/permissions/:targetId", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId, channelId, targetId } = overwriteParams.parse(req.params);

    const overwrite = await roleService.setOverwrite(userId, guildId, channelId, targetId, setOverwriteInput.parse(req.body));

    notifyPermissionChange(guildId);
    return overwrite ?? { removed: true };
  });

  app.delete("/bot/guilds/:guildId/channels/:channelId/permissions/:targetId", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { guildId, channelId, targetId } = overwriteParams.parse(req.params);

    await roleService.removeOverwrite(userId, guildId, channelId, targetId);

    notifyPermissionChange(guildId);
    return reply.status(204).send();
  });

  app.post("/bot/interactions/:interactionId/:token/callback", async (req) => {
    const { userId } = await botDoToken(req);
    const { interactionId, token } = interactionParams.parse(req.params);
    const body = interactionCallbackInput.parse(req.body);

    const interaction = await interactionService.claim(userId, interactionId, token);

    try {
      let message = null;

      if (body.type === "reply") {
        const { embeds, components, ephemeral, ...data } = body.data;

        message = ephemeral
          ? await sendEphemeral(
              userId,
              { userId: interaction.userId, channelId: interaction.channelId },
              { content: data.content, embeds, components },
            )
          : await sendMessage(userId, { ...data, channelId: interaction.channelId }, undefined, { embeds, components });
      } else if (body.type === "update") {
        if (interaction.kind !== "component") {
          throw new AppError("update only works on a component interaction; use reply for commands", 400);
        }

        message = interaction.sourceEphemeral
          ? await editEphemeral(userId, interaction.messageId, body.data)
          : await editMessage(userId, { messageId: interaction.messageId, ...body.data });
      }

      io().to(rooms.user(interaction.userId)).emit("interaction:finished", {
        interactionId,
        messageId: interaction.messageId,
        customId: interaction.customId,
      });

      return { type: body.type, message };
    } catch (err) {
      await interactionService.release(interactionId);
      throw err;
    }
  });

  app.put("/bot/comandos", async (req) => {
    const { botId } = await botDoToken(req);
    const { commands } = setCommandsInput.parse(req.body);

    const savedItems = await botService.setCommands(botId, commands);

    for (const server of await botService.servers(botId)) {
      io().to(rooms.guild(server.id)).emit("commands:changed", { guildId: server.id });
    }

    return { commands: savedItems };
  });

  app.post("/bot/canais/:channelId/mensagens", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { channelId } = channelParams.parse(req.params);

    const { embeds, components, ...body } = botSendMessageInput.parse(req.body);

    const message = await sendMessage(userId, { ...body, channelId }, undefined, { embeds, components });

    return reply.status(201).send(message);
  });

  app.get("/bot/canais/:channelId/mensagens", async (req) => {
    const { userId } = await botDoToken(req);
    const { channelId } = channelParams.parse(req.params);
    const { before, limit } = historyQuery.parse(req.query);

    return messageService.history(userId, channelId, { before, limit });
  });

  app.get("/bot/canais/:channelId/fixadas", async (req) => {
    const { userId } = await botDoToken(req);
    const { channelId } = channelParams.parse(req.params);

    return messageService.pinned(userId, channelId);
  });

  app.put("/bot/mensagens/:messageId/fixar", async (req) => {
    const { userId } = await botDoToken(req);
    const { messageId } = messageParams.parse(req.params);

    return messageService.pin(userId, messageId, true);
  });

  app.delete("/bot/mensagens/:messageId/fixar", async (req) => {
    const { userId } = await botDoToken(req);
    const { messageId } = messageParams.parse(req.params);

    return messageService.pin(userId, messageId, false);
  });

  app.patch("/bot/mensagens/:messageId", async (req) => {
    const { userId } = await botDoToken(req);
    const { messageId } = messageParams.parse(req.params);
    const { content, embeds, components } = botEditMessageInput.parse(req.body);

    return editMessage(userId, { messageId, content, embeds, components });
  });

  app.delete("/bot/mensagens/:messageId", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { messageId } = messageParams.parse(req.params);

    await deleteMessage(userId, messageId);

    return reply.status(204).send();
  });

  app.put("/bot/mensagens/:messageId/reacoes/:emoji", async (req) => {
    const { userId } = await botDoToken(req);
    const { messageId, emoji } = reactionParams.parse(req.params);
    const { burst } = reactionBody.parse(req.body ?? {});

    const { reactions } = await react(userId, messageId, emoji, true, burst ?? false);

    return { reactions };
  });

  app.delete("/bot/mensagens/:messageId/reacoes/:emoji", async (req) => {
    const { userId } = await botDoToken(req);
    const { messageId, emoji } = reactionParams.parse(req.params);

    const { reactions } = await react(userId, messageId, emoji, false);

    return { reactions };
  });
}
