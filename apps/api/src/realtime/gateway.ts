import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import type { FastifyInstance } from "fastify";
import { rooms } from "@gravae/shared";
import { env } from "~/env.js";
import { corsOrigin } from "~/lib/origins.js";
import { memberRepository } from "~/repositories/guild-repository.js";
import { setIo, type GravaeServer } from "./io.js";
import { registerHandlers, cleanupVoiceOnDisconnect, broadcastPresence } from "./handlers.js";
import { presenceService } from "~/services/presence-service.js";
import { voiceService } from "~/services/voice-service.js";

export async function createGateway(app: FastifyInstance) {
  const server: GravaeServer = new Server(app.server, {
    /**
     * Atrás de um túnel, o proxy repassa o Origin original — que não é o
     * WEB_ORIGIN. Sem aceitar isso, o socket é recusado e o chat fica mudo
     * exatamente quando você compartilha o link com alguém.
     */
    cors: { origin: (origin, cb) => corsOrigin(origin, cb), credentials: true },
    // WebSocket puro. O long-polling do Socket.IO exige sessao sticky assim que
    // houver mais de uma instancia da API, e nao precisamos dele em 2026.
    transports: ["websocket"],
    pingInterval: 20_000,
    pingTimeout: 25_000,
  });

  /**
   * Adapter de Redis: sem ele, com duas instancias da API, uma mensagem enviada
   * por quem esta na instancia A nunca chega em quem esta conectado na B.
   * Pub/sub exigem conexoes dedicadas — dai o duplicate().
   */
  const pub = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const sub = pub.duplicate();
  server.adapter(createAdapter(pub, sub));

  // ----------------------------- autenticacao ------------------------------

  server.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) return next(new Error("Sem token"));

    try {
      const payload = app.jwt.verify<{ sub: string }>(token);
      socket.data.userId = payload.sub;
      socket.data.voiceChannelId = null;
    } catch {
      return next(new Error("Token inválido ou expirado"));
    }

    /**
     * Carrega os servidores AQUI, no handshake, e nao no "connection": assim o
     * handler de conexao fica 100% sincrono e nenhum evento enviado logo apos o
     * connect se perde por chegar antes dos listeners existirem.
     */
    try {
      const memberships = await memberRepository.guildIdsOf(socket.data.userId);
      socket.data.guildIds = memberships.map((m) => m.guildId);
      next();
    } catch (err) {
      next(err as Error);
    }
  });

  server.on("connection", (socket) => {
    const userId = socket.data.userId;

    // Listeners primeiro, sem await no meio — ver a nota no middleware acima.
    registerHandlers(socket);

    socket.on("disconnect", () => {
      // Sempre com .catch(): uma rejeicao nao tratada aqui derruba o processo
      // inteiro no Node 22 — a API cai por causa de um socket que fechou.
      presenceService
        .onDisconnect(userId)
        .then((status) => (status ? broadcastPresence(userId, status) : undefined))
        .catch((err) => app.log.error({ err, userId }, "falha ao desconectar"));

      // so limpa a voz se ESTE socket era o que estava na call: outra aba do
      // mesmo usuario pode continuar conectada.
      if (socket.data.voiceChannelId) {
        cleanupVoiceOnDisconnect(userId, socket.id).catch((err) =>
          app.log.error({ err, userId }, "falha ao limpar estado de voz"),
        );
      }
    });

    /**
     * Sala pessoal + a de cada servidor: e o que permite as rotas REST avisarem
     * o usuario (convite aceito, canal criado) sem saber qual socket e o dele.
     */
    socket.join([rooms.user(userId), ...socket.data.guildIds.map(rooms.guild)]);

    presenceService
      .onConnect(userId)
      .then((status) => (status ? broadcastPresence(userId, status) : undefined))
      .catch((err) => app.log.error({ err, userId }, "falha ao registrar presença"));
  });

  setIo(server);
  await Promise.all([presenceService.reset(), voiceService.reset()]);

  app.addHook("onClose", async () => {
    await server.close();
    await Promise.allSettled([pub.quit(), sub.quit()]);
  });

  return server;
}
