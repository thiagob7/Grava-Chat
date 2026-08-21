import type { FastifyInstance } from "fastify";
import { rooms } from "@gravae/shared";
import { guildService } from "~/services/guild-service.js";
import { inviteService } from "~/services/invite-service.js";
import { io } from "~/realtime/io.js";
import { inviteParams } from "~/validations/common.js";

export async function inviteRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/invites/:code", (req) => {
    const { code } = inviteParams.parse(req.params);
    return inviteService.preview(req.userId, code);
  });

  app.post("/invites/:code/join", async (req) => {
    const { code } = inviteParams.parse(req.params);
    const result = await inviteService.accept(req.userId, code);

    if (result.member) {
      // Avisa quem já está no servidor e coloca o recém-chegado na sala do
      // guild sem precisar reconectar.
      io().to(rooms.guild(result.guildId)).emit("member:joined", result.member);
      io().in(rooms.user(req.userId)).socketsJoin(rooms.guild(result.guildId));

      // e a saudação cai no canal do sistema, se o servidor tiver um
      const saudacao = await guildService.boasVindas(result.guildId, req.userId);
      if (saudacao) io().to(rooms.channel(saudacao.channelId)).emit("message:created", saudacao);
    }

    return { guildId: result.guildId, alreadyMember: result.alreadyMember };
  });
}
