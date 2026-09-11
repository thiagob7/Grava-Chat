import type { FastifyInstance } from "fastify";
import { messageService } from "~/services/message-service.js";
import { messageFavoriteService } from "~/services/message-favorite-service.js";
import { accessService } from "~/services/access-service.js";
import { reportService, REPORT_REASONS } from "~/services/denuncia-service.js";
import { objectId, channelParams } from "~/validations/common.js";
import { rooms } from "@gravae/shared";
import { z } from "zod";
import { io } from "~/realtime/io.js";
import { removeAttachment } from "~/realtime/difusao.js";
import { searchQuery, historyQuery } from "~/validations/message.js";

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

  app.get("/messages/:messageId/reactions", (req) => {
    const { messageId } = messageParams.parse(req.params);
    return messageService.whoReacted(req.userId, messageId);
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

  app.delete("/messages/:messageId/anexos/:attachmentId", async (req, reply) => {
    const { messageId, attachmentId } = attachmentParams.parse(req.params);

    await removeAttachment(req.userId, messageId, attachmentId);

    return reply.status(204).send();
  });

  app.post(
    "/messages/:messageId/denuncias",
    { config: { rateLimit: { max: 5, timeWindow: "1 hour" } } },
    async (req, reply) => {
      const { messageId } = messageParams.parse(req.params);
      const data = z
        .object({
          reason: z.enum(REPORT_REASONS),
          details: z.string().trim().max(1000).optional(),
        })
        .parse(req.body);

      const result = await reportService.reportMessage(req.userId, messageId, data, req.log);
      return reply.code(201).send(result);
    },
  );

  app.get("/messages/busca", (req) => {
    const { q, ...filters } = searchQuery.parse(req.query);
    return messageService.search(req.userId, { ...filters, term: q });
  });

  app.get("/messages/favoritas", (req) => messageFavoriteService.list(req.userId));

  app.get("/messages/favoritas/ids", (req) => messageFavoriteService.idsDe(req.userId));

  app.put("/messages/:messageId/favorita", (req) => {
    const { messageId } = messageParams.parse(req.params);
    return messageFavoriteService.toggle(req.userId, messageId, true);
  });

  app.delete("/messages/:messageId/favorita", (req) => {
    const { messageId } = messageParams.parse(req.params);
    return messageFavoriteService.toggle(req.userId, messageId, false);
  });
}

const messageParams = z.object({ messageId: objectId });
const attachmentParams = messageParams.extend({ attachmentId: objectId });
