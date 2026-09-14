import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import type { FastifyInstance } from "fastify";
import { rooms } from "@gravae/shared";
import { env } from "~/env.js";
import { watch } from "~/lib/redis.js";
import { corsOrigin } from "~/lib/origins.js";
import { accessRevoked } from "~/lib/token-revocation.js";
import { channelRepository, memberRepository } from "~/repositories/guild-repository.js";
import { accessService } from "~/services/access-service.js";
import { setIo, type GravaeServer } from "./io.js";
import {
  registerHandlers,
  cleanupVoiceOnDisconnect,
  broadcastPresence,
  watchCallsGhost,
} from "./handlers.js";
import { presenceService } from "~/services/presence-service.js";
import { voiceService } from "~/services/voice-service.js";
import { botService } from "~/services/bot-service.js";

export async function createGateway(app: FastifyInstance) {
  const server: GravaeServer = new Server(app.server, {
    cors: { origin: (origin, cb) => corsOrigin(origin, cb), credentials: true },
    transports: ["websocket"],
    pingInterval: 20_000,
    pingTimeout: 25_000,
  });

  /*
    Estes dois continuam sem teto de tentativa, ao contrário do cliente
    principal, e é de propósito.

    Eles não atendem requisição: carregam a difusão entre as instâncias. Desistir
    aqui não devolve conexão para ninguém, só some com o evento — alguém deixa de
    ver a mensagem que chegou. Insistir até o Redis voltar é o comportamento
    certo para este par, e é o que o adaptador do Socket.IO espera.
  */
  const pub = watch(new Redis(env.REDIS_URL, { maxRetriesPerRequest: null }), "pub");
  const sub = watch(pub.duplicate(), "sub");
  server.adapter(createAdapter(pub, sub));

  server.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) return next(new Error("Sem token"));

    const isBot = token.startsWith("Bot ");

    if (isBot) {
      const owner = await botService.resolveToken(token.slice(4).trim());
      if (!owner) return next(new Error("Token de bot inválido"));

      socket.data.userId = owner.userId;
      socket.data.voiceChannelId = null;
      socket.data.isBot = true;
    } else {
      try {
        const payload = app.jwt.verify<{ sub: string; iat?: number }>(token);
        if (await accessRevoked(payload.sub, payload.iat)) return next(new Error("Token inválido ou expirado"));
        socket.data.userId = payload.sub;
        socket.data.voiceChannelId = null;
      } catch {
        return next(new Error("Token inválido ou expirado"));
      }
    }

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

    registerHandlers(socket);

    socket.on("disconnect", () => {
      presenceService
        .onDisconnect(userId)
        .then((status) => (status ? broadcastPresence(userId, status) : undefined))
        .catch((err) => app.log.error({ err, userId }, "falha ao desconectar"));

      cleanupVoiceOnDisconnect(userId, socket.id).catch((err) =>
        app.log.error({ err, userId }, "falha ao limpar estado de voz"),
      );
    });

    socket.join([rooms.user(userId), ...socket.data.guildIds.map(rooms.guild)]);

    subscribeChannels(socket).catch((err) =>
      app.log.error({ err, userId }, "falha ao inscrever nos canais"),
    );

    presenceService
      .onConnect(userId)
      .then((status) => (status ? broadcastPresence(userId, status) : undefined))
      .catch((err) => app.log.error({ err, userId }, "falha ao registrar presença"));
  });

  setIo(server);
  await Promise.all([presenceService.reset(), voiceService.reset()]);

  presenceService
    .migrateDesired()
    .then((count) => count && app.log.info(`status escolhido: ${count} conta(s) trazida(s) do Redis`))
    .catch((err) => app.log.error({ err }, "falha ao migrar o status escolhido"));

  const stopWatches = watchCallsGhost((err) =>
    app.log.error({ err }, "falha ao varrer chamadas fantasma"),
  );

  app.addHook("onClose", async () => {
    stopWatches();
    await server.close();
    await Promise.allSettled([pub.quit(), sub.quit()]);
  });

  return server;
}

async function subscribeChannels(socket: {
  data: { userId: string; guildIds: string[]; isBot?: boolean };
  join: (rooms: string[]) => void;
}) {
  const channels = await accessService.listenableChannels(
    socket.data.userId,
    socket.data.guildIds,
  );

  if (channels.length) socket.join(channels.map(rooms.channel));
}
