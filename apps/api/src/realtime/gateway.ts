import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import type { FastifyInstance } from "fastify";
import { rooms } from "@gravae/shared";
import { env } from "~/env.js";
import { vigiar } from "~/lib/redis.js";
import { corsOrigin } from "~/lib/origins.js";
import { channelRepository, memberRepository } from "~/repositories/guild-repository.js";
import { accessService } from "~/services/access-service.js";
import { setIo, type GravaeServer } from "./io.js";
import {
  registerHandlers,
  cleanupVoiceOnDisconnect,
  broadcastPresence,
  vigiarChamadasFantasma,
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

  const pub = vigiar(new Redis(env.REDIS_URL, { maxRetriesPerRequest: null }), "pub");
  const sub = vigiar(pub.duplicate(), "sub");
  server.adapter(createAdapter(pub, sub));

  server.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) return next(new Error("Sem token"));

    const ehBot = token.startsWith("Bot ");

    if (ehBot) {
      const dono = await botService.resolverToken(token.slice(4).trim());
      if (!dono) return next(new Error("Token de bot inválido"));

      socket.data.userId = dono.userId;
      socket.data.voiceChannelId = null;
      socket.data.ehBot = true;
    } else {
      try {
        const payload = app.jwt.verify<{ sub: string }>(token);
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

    inscreverNosCanais(socket).catch((err) =>
      app.log.error({ err, userId }, "falha ao inscrever nos canais"),
    );

    presenceService
      .onConnect(userId)
      .then((status) => (status ? broadcastPresence(userId, status) : undefined))
      .catch((err) => app.log.error({ err, userId }, "falha ao registrar presença"));
  });

  setIo(server);
  await Promise.all([presenceService.reset(), voiceService.reset()]);

  const pararVigia = vigiarChamadasFantasma((err) =>
    app.log.error({ err }, "falha ao varrer chamadas fantasma"),
  );

  app.addHook("onClose", async () => {
    pararVigia();
    await server.close();
    await Promise.allSettled([pub.quit(), sub.quit()]);
  });

  return server;
}

async function inscreverNosCanais(socket: {
  data: { userId: string; guildIds: string[]; ehBot?: boolean };
  join: (rooms: string[]) => void;
}) {
  const canais = await accessService.listenableChannels(
    socket.data.userId,
    socket.data.guildIds,
  );

  if (canais.length) socket.join(canais.map(rooms.channel));
}
