import type { FastifyInstance } from "fastify";
import { messageService } from "~/services/message-service.js";
import { accessService } from "~/services/access-service.js";
import { objectId, channelParams } from "~/validations/common.js";
import { rooms } from "@gravae/shared";
import { z } from "zod";
import { io } from "~/realtime/io.js";
import { historyQuery } from "~/validations/message.js";

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

  /**
   * Fixar e desafixar mudam a mensagem, então o evento que sai é o mesmo
   * `message:updated` de sempre — a tela não precisa de um caminho novo só
   * para o alfinete aparecer.
   */
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
}

const messageParams = z.object({ messageId: objectId });
