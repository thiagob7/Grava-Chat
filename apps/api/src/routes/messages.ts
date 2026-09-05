import type { FastifyInstance } from "fastify";
import { messageService } from "~/services/message-service.js";
import { messageFavoriteService } from "~/services/message-favorite-service.js";
import { accessService } from "~/services/access-service.js";
import { objectId, channelParams } from "~/validations/common.js";
import { rooms } from "@gravae/shared";
import { z } from "zod";
import { io } from "~/realtime/io.js";
import { removerAnexo } from "~/realtime/difusao.js";
import { buscaQuery, historyQuery } from "~/validations/message.js";

export async function messageRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/channels/:channelId/messages", (req) => {
    const { channelId } = channelParams.parse(req.params);
    return messageService.history(req.userId, channelId, historyQuery.parse(req.query));
  });

  app.get("/channels/:channelId", async (req) => {
    const { channelId } = channelParams.parse(req.params);
    const { channel } = await accessService.requireChannelAccess(req.userId, channelId);
    return channel;
  });

  app.get("/channels/:channelId/pins", (req) => {
    const { channelId } = channelParams.parse(req.params);
    return messageService.pinned(req.userId, channelId);
  });

  app.put("/messages/:messageId/pin", async (req) => {
    const { messageId } = messageParams.parse(req.params);
    const message = await messageService.pin(req.userId, messageId, true);

    io().to(rooms.channel(message.channelId)).emit("message:updated", message);
    return message;
  });

  app.delete("/messages/:messageId/pin", async (req) => {
    const { messageId } = messageParams.parse(req.params);
    const message = await messageService.pin(req.userId, messageId, false);

    io().to(rooms.channel(message.channelId)).emit("message:updated", message);
    return message;
  });

  app.delete("/messages/:messageId/anexos/:anexoId", async (req, reply) => {
    const { messageId, anexoId } = anexoParams.parse(req.params);

    await removerAnexo(req.userId, messageId, anexoId);

    return reply.status(204).send();
  });

  app.get("/messages/busca", (req) => {
    const { q, guildId, canalId, autorId, before } = buscaQuery.parse(req.query);
    return messageService.buscar(req.userId, { guildId, termo: q, canalId, autorId, before });
  });

  app.get("/messages/favoritas", (req) => messageFavoriteService.listar(req.userId));

  app.get("/messages/favoritas/ids", (req) => messageFavoriteService.idsDe(req.userId));

  app.put("/messages/:messageId/favorita", (req) => {
    const { messageId } = messageParams.parse(req.params);
    return messageFavoriteService.alternar(req.userId, messageId, true);
  });

  app.delete("/messages/:messageId/favorita", (req) => {
    const { messageId } = messageParams.parse(req.params);
    return messageFavoriteService.alternar(req.userId, messageId, false);
  });
}

const messageParams = z.object({ messageId: objectId });
const anexoParams = messageParams.extend({ anexoId: objectId });
