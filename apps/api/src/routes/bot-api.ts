import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { definirComandosInput, editMessageInput, sendMessageInput, rooms } from "@gravae/shared";

import { ForbiddenError, UnauthorizedError } from "~/lib/http.js";
import {
  apagarMensagem,
  editarMensagem,
  enviarMensagem,
  reagir,
} from "~/realtime/difusao.js";
import { io } from "~/realtime/io.js";
import { channelRepository, memberRepository } from "~/repositories/guild-repository.js";
import { botService } from "~/services/bot-service.js";
import { objectId } from "~/validations/common.js";

const guildParams = z.object({ guildId: objectId });
const canalParams = z.object({ channelId: objectId });
const mensagemParams = z.object({ messageId: objectId });

const enviarBody = sendMessageInput.omit({ channelId: true, nonce: true });

const editarBody = editMessageInput.omit({ messageId: true });

const reacaoParams = mensagemParams.extend({ emoji: z.string().min(1).max(80) });
const reacaoBody = z.object({ burst: z.boolean().optional() });

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
