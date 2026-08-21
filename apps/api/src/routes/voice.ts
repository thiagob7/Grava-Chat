import type { FastifyInstance } from "fastify";
import { voiceService } from "~/services/voice-service.js";
import { channelParams } from "~/validations/common.js";

export async function voiceRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/channels/:channelId/voice-token", (req) => {
    const { channelId } = channelParams.parse(req.params);
    return voiceService.issueToken(req.userId, channelId);
  });
}
