import type { FastifyInstance, FastifyRequest } from "fastify";
import { rooms, objectId } from "@gravae/shared";
import { z } from "zod";
import { baseUrlDe } from "~/lib/endereco.js";
import { io } from "~/realtime/io.js";
import { webhookService } from "~/services/webhook-service.js";
import { guildParams } from "~/validations/common.js";
import {
  createWebhookInput,
  updateWebhookInput,
  executeWebhookInput,
} from "~/validations/webhook.js";

const webhookParams = guildParams.extend({ webhookId: objectId });
const executeParams = z.object({ webhookId: objectId, token: z.string().min(16).max(128) });


export async function webhookRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/guilds/:guildId/webhooks", (req) => {
    const { guildId } = guildParams.parse(req.params);
    return webhookService.list(req.userId, guildId, baseUrlDe(req));
  });

  app.post("/guilds/:guildId/webhooks", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const webhook = await webhookService.create(
      req.userId,
      guildId,
      createWebhookInput.parse(req.body),
      baseUrlDe(req),
    );

    return reply.code(201).send(webhook);
  });

  app.patch("/guilds/:guildId/webhooks/:webhookId", (req) => {
    const { guildId, webhookId } = webhookParams.parse(req.params);

    return webhookService.update(
      req.userId,
      guildId,
      webhookId,
      updateWebhookInput.parse(req.body),
      baseUrlDe(req),
    );
  });

  app.delete("/guilds/:guildId/webhooks/:webhookId", async (req, reply) => {
    const { guildId, webhookId } = webhookParams.parse(req.params);

    await webhookService.remove(req.userId, guildId, webhookId);
    return reply.code(204).send();
  });
}

export async function publicWebhookRoutes(app: FastifyInstance) {
  app.post("/webhooks/:webhookId/:token", async (req, reply) => {
    const { webhookId, token } = executeParams.parse(req.params);
    const message = await webhookService.execute(
      webhookId,
      token,
      executeWebhookInput.parse(req.body ?? {}),
    );

    io().to(rooms.channel(message.channelId)).emit("message:created", message);

    return reply.code(201).send({ id: message.id });
  });
}
