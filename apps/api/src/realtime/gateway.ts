import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import type { FastifyInstance } from "fastify";
import { rooms } from "@gravae/shared";
import { env } from "~/env.js";
import { corsOrigin } from "~/lib/origins.js";
import { channelRepository, memberRepository } from "~/repositories/guild-repository.js";
import { accessService } from "~/services/access-service.js";
import { setIo, type GravaeServer } from "./io.js";
import { registerHandlers, cleanupVoiceOnDisconnect, broadcastPresence } from "./handlers.js";
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

  const pub = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const sub = pub.duplicate();
  server.adapter(createAdapter(pub, sub));

  server.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) return next(new Error("Sem token"));

    /*
      Duas portas de entrada, e é isto que faz um bot existir aqui.

      Gente entra com o JWT de sessão, que nasce do cookie e expira. Bot entra
      com "Bot <token>", que não expira e não veio de login nenhum — o código
      dele roda na máquina do dono, fora daqui, e esta é a única forma de ele
      chegar ao gateway.

      Do `socket.data.userId` para baixo os dois são a mesma coisa: o bot é um
      User, e handlers, permissões e salas não precisam saber a diferença.
    */
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

      if (socket.data.voiceChannelId) {
        cleanupVoiceOnDisconnect(userId, socket.id).catch((err) =>
          app.log.error({ err, userId }, "falha ao limpar estado de voz"),
        );
      }
    });

    socket.join([rooms.user(userId), ...socket.data.guildIds.map(rooms.guild)]);

    /*
      Todo mundo entra em tudo o que pode ver, na conexão.

      Era só o bot que fazia isso — a pessoa entrava um canal de cada vez, com
      o `channel:subscribe` de quando abria cada um. O efeito colateral era
      grande: mensagem de canal que você não abriu nesta sessão não chegava no
      navegador, então contador de não-lido, aviso e som só existiam para o
      canal que estava na tela. O aviso que só toca quando você já está
      olhando não é aviso.

      O cálculo é o mesmo de sempre: canal fechado ao seu cargo continua
      fechado, aqui e em qualquer outro lugar.
    */
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

  app.addHook("onClose", async () => {
    await server.close();
    await Promise.allSettled([pub.quit(), sub.quit()]);
  });

  return server;
}

/**
 * As salas de quem acabou de conectar.
 *
 * Bot e pessoa entram do mesmo jeito e pelo mesmo cálculo de permissão; o que
 * muda é só que o bot nunca teve outro caminho, porque ele não abre canal
 * nenhum na tela.
 */
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
