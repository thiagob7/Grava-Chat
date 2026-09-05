import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { definirComandosInput, editMessageInput, sendMessageInput, rooms } from "@gravae/shared";

import { ForbiddenError, UnauthorizedError } from "~/lib/http.js";
import { toPublicUser } from "~/lib/serialize.js";
import {
  apagarMensagem,
  editarMensagem,
  enviarMensagem,
  reagir,
} from "~/realtime/difusao.js";
import { io } from "~/realtime/io.js";
import { channelRepository, memberRepository } from "~/repositories/guild-repository.js";
import { botService } from "~/services/bot-service.js";
import { guildService } from "~/services/guild-service.js";
import { messageService } from "~/services/message-service.js";
import { moderationService } from "~/services/moderation-service.js";
import { roleService } from "~/services/role-service.js";
import { objectId } from "~/validations/common.js";
import { banInput, nicknameInput, timeoutInput } from "~/validations/moderation.js";
import { createChannelInput, updateChannelInput } from "~/validations/guild.js";
import { setMemberRolesInput } from "~/validations/role.js";

const guildParams = z.object({ guildId: objectId });
const canalParams = z.object({ channelId: objectId });
const mensagemParams = z.object({ messageId: objectId });

const enviarBody = sendMessageInput.omit({ channelId: true, nonce: true });

const editarBody = editMessageInput.omit({ messageId: true });

const reacaoParams = mensagemParams.extend({ emoji: z.string().min(1).max(80) });
const reacaoBody = z.object({ burst: z.boolean().optional() });

const membroParams = guildParams.extend({ userId: objectId });
const canalDoServidorParams = guildParams.extend({ channelId: objectId });

const conviteBody = z.object({
  maxUses: z.number().int().min(1).max(1000).nullable().optional(),
  expiresInHours: z.number().int().min(1).max(24 * 365).nullable().optional(),
});

const historicoQuery = z.object({
  before: objectId.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

async function botDoToken(req: FastifyRequest) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho?.startsWith("Bot ")) throw new UnauthorizedError("Falta o token do bot");

  const dono = await botService.resolverToken(cabecalho.slice(4).trim());
  if (!dono) throw new UnauthorizedError("Token de bot inválido");

  return dono;
}

async function exigirPresenca(botUserId: string, guildId: string) {
  const membro = await memberRepository.find(guildId, botUserId);
  if (!membro) throw new ForbiddenError("Esse bot não está nesse servidor");
}

export async function botApiRoutes(app: FastifyInstance) {
  app.get("/bot/eu", async (req) => {
    const { botId, userId } = await botDoToken(req);
    return { botId, userId };
  });

  app.get("/bot/servidores", async (req) => {
    const { botId } = await botDoToken(req);
    return botService.servidoresDe(botId);
  });

  app.get("/bot/servidores/:guildId/canais", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    await exigirPresenca(userId, guildId);

    const canais = await channelRepository.findManyByGuild(guildId);

    return canais.map((c) => ({ id: c.id, name: c.name, type: c.type }));
  });

  app.get("/bot/servidores/:guildId/membros", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    await exigirPresenca(userId, guildId);

    const membros = await memberRepository.findManyByGuild(guildId);

    return membros.map((m) => ({
      userId: m.userId,
      nickname: m.nickname,
      roleIds: m.roleIds,
      joinedAt: m.joinedAt,
      usuario: toPublicUser(m.user),
    }));
  });

  app.get("/bot/servidores/:guildId/cargos", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    return roleService.list(userId, guildId);
  });

  app.patch("/bot/servidores/:guildId/membros/:userId/apelido", async (req) => {
    const { userId: botUserId } = await botDoToken(req);
    const { guildId, userId: alvo } = membroParams.parse(req.params);
    const { nickname } = nicknameInput.parse(req.body);

    return moderationService.apelidar(botUserId, guildId, alvo, nickname);
  });

  app.put("/bot/servidores/:guildId/membros/:userId/cargos", async (req) => {
    const { userId: botUserId } = await botDoToken(req);
    const { guildId, userId: alvo } = membroParams.parse(req.params);

    return roleService.setMemberRoles(botUserId, guildId, alvo, setMemberRolesInput.parse(req.body));
  });

  app.delete("/bot/servidores/:guildId/membros/:userId", async (req, reply) => {
    const { userId: botUserId } = await botDoToken(req);
    const { guildId, userId: alvo } = membroParams.parse(req.params);

    await guildService.removeMember(botUserId, guildId, alvo);

    return reply.status(204).send();
  });

  app.put("/bot/servidores/:guildId/castigos/:userId", async (req) => {
    const { userId: botUserId } = await botDoToken(req);
    const { guildId, userId: alvo } = membroParams.parse(req.params);

    return moderationService.castigar(botUserId, guildId, alvo, timeoutInput.parse(req.body));
  });

  app.get("/bot/servidores/:guildId/banimentos", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    return moderationService.listBans(userId, guildId);
  });

  app.put("/bot/servidores/:guildId/banimentos/:userId", async (req) => {
    const { userId: botUserId } = await botDoToken(req);
    const { guildId, userId: alvo } = membroParams.parse(req.params);

    return moderationService.ban(botUserId, guildId, alvo, banInput.parse(req.body ?? {}));
  });

  app.delete("/bot/servidores/:guildId/banimentos/:userId", async (req, reply) => {
    const { userId: botUserId } = await botDoToken(req);
    const { guildId, userId: alvo } = membroParams.parse(req.params);

    await moderationService.unban(botUserId, guildId, alvo);

    return reply.status(204).send();
  });

  app.post("/bot/servidores/:guildId/canais", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    const canal = await guildService.createChannel(userId, guildId, createChannelInput.parse(req.body));

    return reply.status(201).send(canal);
  });

  app.patch("/bot/servidores/:guildId/canais/:channelId", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId, channelId } = canalDoServidorParams.parse(req.params);

    return guildService.updateChannel(userId, guildId, channelId, updateChannelInput.parse(req.body));
  });

  app.delete("/bot/servidores/:guildId/canais/:channelId", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { guildId, channelId } = canalDoServidorParams.parse(req.params);

    await guildService.deleteChannel(userId, guildId, channelId);

    return reply.status(204).send();
  });

  app.post("/bot/servidores/:guildId/convites", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    const convite = await guildService.createInvite(userId, guildId, conviteBody.parse(req.body ?? {}));

    return reply.status(201).send(convite);
  });

  app.put("/bot/comandos", async (req) => {
    const { botId } = await botDoToken(req);
    const { comandos } = definirComandosInput.parse(req.body);

    const salvos = await botService.definirComandos(botId, comandos);

    for (const servidor of await botService.servidoresDe(botId)) {
      io().to(rooms.guild(servidor.id)).emit("commands:changed", { guildId: servidor.id });
    }

    return { comandos: salvos };
  });

  app.post("/bot/canais/:channelId/mensagens", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { channelId } = canalParams.parse(req.params);

    const message = await enviarMensagem(userId, {
      ...enviarBody.parse(req.body),
      channelId,
    });

    return reply.status(201).send(message);
  });

  app.get("/bot/canais/:channelId/mensagens", async (req) => {
    const { userId } = await botDoToken(req);
    const { channelId } = canalParams.parse(req.params);
    const { before, limit } = historicoQuery.parse(req.query);

    return messageService.history(userId, channelId, { before, limit });
  });

  app.get("/bot/canais/:channelId/fixadas", async (req) => {
    const { userId } = await botDoToken(req);
    const { channelId } = canalParams.parse(req.params);

    return messageService.pinned(userId, channelId);
  });

  app.put("/bot/mensagens/:messageId/fixar", async (req) => {
    const { userId } = await botDoToken(req);
    const { messageId } = mensagemParams.parse(req.params);

    return messageService.pin(userId, messageId, true);
  });

  app.delete("/bot/mensagens/:messageId/fixar", async (req) => {
    const { userId } = await botDoToken(req);
    const { messageId } = mensagemParams.parse(req.params);

    return messageService.pin(userId, messageId, false);
  });

  app.patch("/bot/mensagens/:messageId", async (req) => {
    const { userId } = await botDoToken(req);
    const { messageId } = mensagemParams.parse(req.params);
    const { content } = editarBody.parse(req.body);

    return editarMensagem(userId, { messageId, content });
  });

  app.delete("/bot/mensagens/:messageId", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { messageId } = mensagemParams.parse(req.params);

    await apagarMensagem(userId, messageId);

    return reply.status(204).send();
  });

  app.put("/bot/mensagens/:messageId/reacoes/:emoji", async (req) => {
    const { userId } = await botDoToken(req);
    const { messageId, emoji } = reacaoParams.parse(req.params);
    const { burst } = reacaoBody.parse(req.body ?? {});

    const { reactions } = await reagir(userId, messageId, emoji, true, burst ?? false);

    return { reactions };
  });

  app.delete("/bot/mensagens/:messageId/reacoes/:emoji", async (req) => {
    const { userId } = await botDoToken(req);
    const { messageId, emoji } = reacaoParams.parse(req.params);

    const { reactions } = await reagir(userId, messageId, emoji, false);

    return { reactions };
  });
}
