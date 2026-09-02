import type { FastifyInstance } from "fastify";
import { authService } from "~/services/auth-service.js";
import { meService } from "~/services/me-service.js";
import { presenceService } from "~/services/presence-service.js";
import { io } from "~/realtime/io.js";
import { rooms } from "@gravae/shared";
import { toPerfilPublico, toPublicUser } from "~/lib/serialize.js";
import { memberRepository } from "~/repositories/guild-repository.js";
import { messageService } from "~/services/message-service.js";
import { voiceService } from "~/services/voice-service.js";
import { userRepository } from "~/repositories/user-repository.js";
import { toSelfUser } from "~/lib/serialize.js";
import { updateProfileInput } from "~/validations/auth.js";

export async function meRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/me", async (req) => {
    const [user, providers, desired] = await Promise.all([
      authService.requireUser(req.userId),
      authService.providersOf(req.userId),
      presenceService.desiredOf(req.userId),
    ]);

    return toSelfUser(user, providers, desired);
  });

  app.patch("/me", async (req) => {
    const body = updateProfileInput.parse(req.body);

    const [user, providers, desired] = await Promise.all([
      meService.updateProfile(req.userId, body),
      authService.providersOf(req.userId),
      presenceService.desiredOf(req.userId),
    ]);

    const guilds = await memberRepository.guildIdsOf(req.userId);
    const payload = { user: toPublicUser(user), perfil: toPerfilPublico(user) };

    io()
      .to([rooms.user(req.userId), ...guilds.map((g) => rooms.guild(g.guildId))])
      .emit("user:updated", payload);

    return toSelfUser(user, providers, desired);
  });

  app.get("/me/read-states", (req) => messageService.readStates(req.userId));

  /// Quem está em voz em todos os meus servidores — o trilho usa pra dizer,
  /// na dica de cada servidor, quem está em chamada lá dentro.
  app.get("/me/voice-states", (req) => voiceService.statesForUser(req.userId));

  /// Tudo o que a conta guarda, num JSON. O nome do arquivo sai no cabeçalho
  /// pra quem baixar não receber um "download" sem extensão.
  app.get("/me/exportar", async (req, reply) => {
    const dados = await meService.exportar(req.userId);
    const dia = new Date().toISOString().slice(0, 10);

    return reply
      .header("content-disposition", `attachment; filename="gravae-${dia}.json"`)
      .type("application/json")
      .send(dados);
  });

  /// A aba de menções da caixa de entrada.
  app.get("/me/mentions", (req) => messageService.mentions(req.userId));
}
