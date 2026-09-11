import type { Socket } from "socket.io";
import type { z } from "zod";
import type { PresenceStatus } from "@gravae/shared";
import {
  clientEventSchemas,
  LIMITS,
  rooms,
  type Ack,
  type ClientEventName,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@gravae/shared";
import { AppError, ConflictError, NotFoundError } from "~/lib/http.js";
import { toPublicUser } from "~/lib/serialize.js";
import { expressionRepository } from "~/repositories/expression-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { memberRepository } from "~/repositories/guild-repository.js";
import { accessService } from "~/services/access-service.js";
import { messageService } from "~/services/message-service.js";
import { presenceService } from "~/services/presence-service.js";
import { voiceService, voiceRecipients, VOICE_GRACE_MS } from "~/services/voice-service.js";
import {
  deleteMessage,
  editMessage,
  sendMessage,
  invokeCommand,
  react,
} from "./difusao.js";
import { io, type SocketData } from "./io.js";

type GravaeSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

function on<E extends ClientEventName>(
  socket: GravaeSocket,
  event: E,
  handler: (payload: z.infer<(typeof clientEventSchemas)[E]>, socket: GravaeSocket) => Promise<unknown>,
) {
  const listen = socket.on.bind(socket) as (
    e: string,
    l: (raw: unknown, ack?: Ack<unknown>) => void,
  ) => void;

  listen(event, async (raw: unknown, ack?: Ack<unknown>) => {
    const parsed = clientEventSchemas[event].safeParse(raw);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Payload inválido";
      ack?.({ ok: false, error: message });
      socket.emit("error", { event, message });
      return;
    }

    try {
      const data = await handler(parsed.data as never, socket);
      ack?.({ ok: true, data: data ?? null });
    } catch (err) {
      const isDomainError = err instanceof AppError;
      const message = isDomainError ? err.message : "Erro inesperado";

      if (!isDomainError) console.error(`[socket:${event}]`, err);

      ack?.({ ok: false, error: message, reason: isDomainError ? err.reason : undefined });

      if (!isDomainError || err.notify) socket.emit("error", { event, message });
    }
  });
}

export function registerHandlers(socket: GravaeSocket) {
  const userId = socket.data.userId;

  on(socket, "channel:subscribe", async ({ channelId }) => {
    await accessService.requireChannelAccess(userId, channelId);
    await socket.join(rooms.channel(channelId));
    return { channelId };
  });

  on(socket, "channel:unsubscribe", async ({ channelId }) => {
    await socket.leave(rooms.channel(channelId));
    return { channelId };
  });

  on(socket, "message:send", async (payload) => {
    const message = await sendMessage(userId, payload, socket.id);
    socket.emit("message:created", { ...message, nonce: payload.nonce });

    return { id: message.id };
  });

  on(socket, "message:edit", async (payload) => {
    const message = await editMessage(userId, payload);
    return { id: message.id };
  });

  on(socket, "message:delete", async ({ messageId }) => {
    await deleteMessage(userId, messageId);
    return { id: messageId };
  });

  on(socket, "command:invoke", async (payload) => {
    const message = await invokeCommand(userId, payload);
    return { messageId: message.id };
  });

  on(socket, "message:react", async ({ messageId, emoji, burst }) => {
    const { messageId: id } = await react(userId, messageId, emoji, true, burst ?? false);
    return { messageId: id, emoji };
  });

  on(socket, "message:unreact", async ({ messageId, emoji }) => {
    await react(userId, messageId, emoji, false);
    return { messageId, emoji };
  });

  on(socket, "message:ack", async ({ channelId, messageId }) => {
    await messageService.markRead(userId, channelId, messageId);
    return { channelId };
  });

  on(socket, "message:unread", async ({ channelId, messageId }) => {
    await messageService.markUnread(userId, channelId, messageId);
    return { channelId };
  });

  on(socket, "poll:vote", async ({ messageId, optionId }) => {
    const message = await messageService.vote(userId, messageId, optionId);
    io().to(rooms.channel(message.channelId)).emit("message:updated", message);

    return { id: message.id };
  });

  on(socket, "poll:close", async ({ messageId }) => {
    const message = await messageService.endPoll(userId, messageId);
    io().to(rooms.channel(message.channelId)).emit("message:updated", message);

    return { id: message.id };
  });

  on(socket, "typing:start", async ({ channelId }) => {
    await accessService.requireChannelAccess(userId, channelId);
    const user = await userRepository.findByIdOrThrow(userId);

    socket.to(rooms.channel(channelId)).emit("typing:started", { channelId, user: toPublicUser(user) });
    return null;
  });

  on(socket, "presence:update", async ({ status }) => {
    const projected = await presenceService.setDesired(userId, status);
    await broadcastPresence(userId, projected);

    io().to(rooms.user(userId)).emit("presence:self", { status, projected });
    return { status };
  });

  on(socket, "presence:afk", async ({ idle }) => {
    await presenceService.setIdle(userId, idle);
    await broadcastPresence(userId);
    return { idle };
  });

  on(socket, "voice:token", ({ channelId }) => voiceService.issueToken(userId, channelId));

  on(socket, "voice:onde", async ({ userId: target }) => {
    const state = await voiceService.get(target);
    return { channelId: state?.channelId ?? null };
  });

  on(socket, "voice:join", async ({ channelId, resume, client }) => {
    const { state, left } = await voiceService.join(
      userId,
      channelId,
      socket.id,
      resume,
      client ?? null,
    );
    socket.data.voiceChannelId = channelId;

    if (left) await announceLeave(left.guildId, left.channelId, userId);

    io().to(await voiceRecipients(state)).emit("voice:joined", state);
    return state;
  });

  on(socket, "voice:leave", async () => {
    const state = await voiceService.leave(userId);
    socket.data.voiceChannelId = null;

    if (state) await announceLeave(state.guildId, state.channelId, userId);
    return state ? { channelId: state.channelId } : null;
  });

  on(socket, "voice:state", async (patch) => {
    const state = await voiceService.update(userId, patch);
    io().to(await voiceRecipients(state)).emit("voice:updated", state);
    return state;
  });

  on(socket, "voice:sound", async ({ soundId }) => {
    const state = await voiceService.get(userId);
    if (!state) throw new ConflictError("Você não está numa chamada");

    if (waitingForPlay(userId)) throw new AppError("Espera um pouquinho antes do próximo som");

    if (!state.guildId) throw new AppError("O painel de sons só existe em servidor");

    const context = await accessService.requirePermission(
      userId,
      state.guildId,
      "USE_SOUNDBOARD",
      state.channelId,
    );
    void context;

    const sound = await expressionRepository.findSoundById(soundId);
    if (!sound || sound.guildId !== state.guildId) throw new NotFoundError("Som não encontrado");

    io()
      .to(rooms.guild(state.guildId))
      .emit("voice:sound", {
        channelId: state.channelId,
        userId,
        url: sound.url,
        volume: sound.volume,
      });

    return { id: sound.id };
  });

  on(socket, "voice:moderate", async ({ userId: targetId, serverMute, serverDeaf }) => {
    const state = await voiceService.get(targetId);
    if (!state) throw new NotFoundError("Esta pessoa não está numa chamada");
    if (!state.guildId) throw new AppError("Não há moderação numa chamada de privado");

    if (serverMute !== undefined) {
      await accessService.requirePermission(userId, state.guildId, "MUTE_MEMBERS");
    }
    if (serverDeaf !== undefined) {
      await accessService.requirePermission(userId, state.guildId, "DEAFEN_MEMBERS");
    }

    const updated = await voiceService.moderate(targetId, { serverMute, serverDeaf });
    if (updated) io().to(await voiceRecipients(updated)).emit("voice:updated", updated);

    return updated;
  });

  on(socket, "voice:recusar", async ({ channelId }) => {
    const { channel } = await accessService.requireChannelAccess(userId, channelId);
    if (channel.guildId) throw new AppError("Isso só existe numa chamada de privado");

    io()
      .to(channel.recipients.map(rooms.user))
      .emit("voice:recusada", { channelId, userId });

    return { channelId };
  });

  on(socket, "voice:kick", async ({ userId: targetId }) => {
    const state = await voiceService.get(targetId);
    if (!state) throw new NotFoundError("Esta pessoa não está numa chamada");
    if (!state.guildId) throw new AppError("Não dá pra expulsar de uma chamada de privado");

    await accessService.requirePermission(userId, state.guildId, "MOVE_MEMBERS");
    await voiceService.sfuDisconnect(state.channelId, targetId);

    const left = await voiceService.leave(targetId);
    if (left) await announceLeave(left.guildId, left.channelId, targetId);

    io().to(rooms.user(targetId)).emit("voice:move", { channelId: "" });
    return { userId: targetId };
  });

  on(socket, "voice:moveMember", async ({ userId: targetId, channelId }) => {
    const state = await voiceService.get(targetId);
    if (!state) throw new NotFoundError("Esta pessoa não está numa chamada");
    if (!state.guildId) throw new AppError("Não dá pra mover alguém de uma chamada de privado");

    await accessService.requirePermission(userId, state.guildId, "MOVE_MEMBERS");

    const { channel } = await accessService.requireChannelAccess(targetId, channelId);
    if (channel.type !== "VOICE") throw new AppError("Só dá pra mover para canal de voz");

    await voiceService.sfuDisconnect(state.channelId, targetId);
    io().to(rooms.user(targetId)).emit("voice:move", { channelId });

    return { userId: targetId, channelId };
  });
}

const lastSound = new Map<string, number>();

function waitingForPlay(userId: string): boolean {
  const now = Date.now();
  const anterior = lastSound.get(userId);

  if (anterior !== undefined && now - anterior < LIMITS.soundWaitMs) return true;

  if (lastSound.size > 500) {
    for (const [id, when] of lastSound) {
      if (now - when > LIMITS.soundWaitMs) lastSound.delete(id);
    }
  }

  lastSound.set(userId, now);
  return false;
}

async function announceLeave(guildId: string | null, channelId: string, userId: string) {
  const destinations = await voiceRecipients({ guildId, channelId });
  io().to(destinations).emit("voice:left", { channelId, userId });
}

const SWEEP_MS_INTERVAL = 30_000;

export function watchCallsGhost(onFail: (err: unknown) => void) {
  const sweep = () =>
    voiceService
      .reconcile()
      .then(({ fromRedis }) => {
        for (const state of fromRedis) {
          void announceLeave(state.guildId, state.channelId, state.userId);
        }
      })
      .catch(onFail);

  void sweep();

  const clock = setInterval(() => void sweep(), SWEEP_MS_INTERVAL);
  clock.unref();

  return () => clearInterval(clock);
}

export async function broadcastPresence(userId: string, status?: PresenceStatus) {
  const projected = status ?? (await presenceService.mapFor([userId]))[userId] ?? "OFFLINE";
  const memberships = await memberRepository.guildIdsOf(userId);

  io()
    .to(memberships.map((m) => rooms.guild(m.guildId)))
    .emit("presence:changed", { userId, status: projected });
}

export async function cleanupVoiceOnDisconnect(userId: string, socketId: string) {
  const orphaned = await voiceService.orphan(userId, socketId);
  if (!orphaned) return;

  setTimeout(() => {
    void voiceService
      .reapOrphan(userId, socketId)
      .then((state) => {
        if (state) void announceLeave(state.guildId, state.channelId, userId);
      })
      .catch(() => undefined);
  }, VOICE_GRACE_MS).unref();
}
