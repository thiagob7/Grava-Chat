import type { Socket } from "socket.io";
import type { z } from "zod";
import type { PresenceStatus } from "@gravae/shared";
import {
  clientEventSchemas,
  has,
  LIMITS,
  rooms,
  type Ack,
  type ClientEventName,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@gravae/shared";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "~/lib/http.js";
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
import { io, ioIfReady, type SocketData } from "./io.js";

type GravaeSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

const WINDOW_MS = 10_000;
const DEFAULT_PER_WINDOW = 30;
const PER_WINDOW: Partial<Record<ClientEventName, number>> = {
  "typing:start": 8,
  "presence:update": 6,
  "presence:afk": 6,
  "message:react": 20,
  "message:unreact": 20,
  "voice:token": 10,
  "voice:join": 10,
  "voice:onde": 20,
  "voice:recusar": 10,
  "channel:subscribe": 60,
};

const usage = new WeakMap<GravaeSocket, Map<string, { start: number; count: number }>>();

function overLimit(socket: GravaeSocket, event: ClientEventName) {
  const now = Date.now();
  const byEvent = usage.get(socket) ?? new Map<string, { start: number; count: number }>();
  usage.set(socket, byEvent);

  const current = byEvent.get(event);
  if (!current || now - current.start >= WINDOW_MS) {
    byEvent.set(event, { start: now, count: 1 });
    return false;
  }

  current.count += 1;
  return current.count > (PER_WINDOW[event] ?? DEFAULT_PER_WINDOW);
}

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
    if (overLimit(socket, event)) {
      ack?.({ ok: false, error: "Devagar: muitas ações seguidas" });
      return;
    }

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

      if (!isDomainError || (err.notify && !err.reason)) socket.emit("error", { event, message });
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

  on(socket, "voice:token", ({ channelId }) => voiceService.issueToken(userId, channelId, Boolean(socket.data.isBot)));

  on(socket, "voice:onde", async ({ userId: target }) => {
    const state = await voiceService.get(target);
    if (!state) return { channelId: null };

    const visible = await accessService
      .requireChannelAccess(userId, state.channelId)
      .then(() => true)
      .catch(() => false);

    return { channelId: visible ? state.channelId : null };
  });

  on(socket, "voice:join", async ({ channelId, resume, client, device }) => {
    const { state, left } = await voiceService.join(
      userId,
      channelId,
      socket.id,
      resume,
      client ?? null,
      device ?? null,
      Boolean(socket.data.isBot),
    );
    socket.data.voiceChannelId = channelId;

    if (left) await announceLeave(left.guildId, left.channelId, userId);

    io().to(await voiceRecipients(state)).emit("voice:joined", state);
    return state;
  });

  on(socket, "voice:leave", async ({ channelId }) => {
    if (socket.data.isBot) {
      const states = (await voiceService.statesOf(userId)).filter((s) => !channelId || s.channelId === channelId);
      const left = (await Promise.all(states.map((s) => voiceService.leaveState(s)))).filter(
        (s): s is NonNullable<typeof s> => Boolean(s),
      );

      for (const state of left) await announceLeave(state.guildId, state.channelId, userId);
      return left[0] ? { channelId: left[0].channelId } : null;
    }

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

    await accessService.requirePermission(userId, state.guildId, "USE_SOUNDBOARD", state.channelId);

    const sound = await expressionRepository.findSoundById(soundId);
    if (!sound || sound.guildId !== state.guildId) throw new NotFoundError("Som não encontrado");

    io()
      .to(await voiceRecipients(state))
      .emit("voice:sound", {
        channelId: state.channelId,
        userId,
        url: sound.url,
        volume: sound.volume,
      });

    return { id: sound.id };
  });

  on(socket, "voice:moderate", async ({ userId: targetId, fromChannelId, serverMute, serverDeaf }) => {
    const state = await stateToModerate(userId, targetId, fromChannelId);
    if (!state) throw new NotFoundError("Esta pessoa não está numa chamada");
    if (!state.guildId) throw new AppError("Não há moderação numa chamada de privado");

    const context = await accessService.contextOf(userId, state.guildId, state.channelId);

    if (serverMute !== undefined && !has(context.permissions, "MUTE_MEMBERS")) {
      throw new ForbiddenError("Você não tem permissão para isso");
    }
    if (serverDeaf !== undefined && !has(context.permissions, "DEAFEN_MEMBERS")) {
      throw new ForbiddenError("Você não tem permissão para isso");
    }
    if (targetId !== userId) await accessService.targetRequireAbove(context, state.guildId, targetId);

    const updated = await voiceService.moderate(state, { serverMute, serverDeaf });
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

  on(socket, "voice:kick", async ({ userId: targetId, fromChannelId }) => {
    const state = await stateToModerate(userId, targetId, fromChannelId);
    if (!state) throw new NotFoundError("Esta pessoa não está numa chamada");
    if (!state.guildId) throw new AppError("Não dá pra expulsar de uma chamada de privado");

    const context = await accessService.requirePermission(userId, state.guildId, "MOVE_MEMBERS", state.channelId);
    if (targetId !== userId) await accessService.targetRequireAbove(context, state.guildId, targetId);

    await voiceService.sfuDisconnect(state.channelId, targetId);

    const left = await voiceService.leaveState(state);
    if (left) await announceLeave(left.guildId, left.channelId, targetId);

    io().to(rooms.user(targetId)).emit("voice:move", { channelId: "", fromChannelId: state.channelId });
    return { userId: targetId };
  });

  on(socket, "voice:moveMember", async ({ userId: targetId, channelId, fromChannelId }) => {
    const state = await stateToModerate(userId, targetId, fromChannelId);
    if (!state) throw new NotFoundError("Esta pessoa não está numa chamada");
    if (!state.guildId) throw new AppError("Não dá pra mover alguém de uma chamada de privado");

    const context = await accessService.requirePermission(userId, state.guildId, "MOVE_MEMBERS", state.channelId);
    if (targetId !== userId) await accessService.targetRequireAbove(context, state.guildId, targetId);
    await accessService.requirePermission(userId, state.guildId, "MOVE_MEMBERS", channelId);

    const { channel } = await accessService.requireChannelAccess(targetId, channelId);
    if (channel.type !== "VOICE") throw new AppError("Só dá pra mover para canal de voz");

    await voiceService.sfuDisconnect(state.channelId, targetId);
    io().to(rooms.user(targetId)).emit("voice:move", { channelId, fromChannelId: state.channelId });

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
  if (!ioIfReady()) return;

  const destinations = await voiceRecipients({ guildId, channelId });
  ioIfReady()?.to(destinations).emit("voice:left", { channelId, userId });
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
  if (!ioIfReady()) return;

  const projected = status ?? (await presenceService.mapFor([userId]))[userId] ?? "OFFLINE";
  const memberships = await memberRepository.guildIdsOf(userId);

  ioIfReady()
    ?.to(memberships.map((m) => rooms.guild(m.guildId)))
    .emit("presence:changed", { userId, status: projected });
}

export async function cleanupVoiceOnDisconnect(userId: string, socketId: string) {
  const orphaned = await voiceService.orphan(userId, socketId);
  if (!orphaned.length) return;

  setTimeout(() => {
    void voiceService
      .reapOrphan(userId, socketId)
      .then((states) => {
        for (const state of states) void announceLeave(state.guildId, state.channelId, userId);
      })
      .catch(() => undefined);
  }, VOICE_GRACE_MS).unref();
}

async function stateToModerate(actorId: string, targetId: string, fromChannelId?: string) {
  const states = await voiceService.statesOf(targetId);
  if (fromChannelId) return states.find((s) => s.channelId === fromChannelId) ?? null;
  if (states.length <= 1) return states[0] ?? null;

  const actorState = await voiceService.get(actorId);
  const sameGuild = states.find((s) => s.guildId && s.guildId === actorState?.guildId);
  if (sameGuild) return sameGuild;

  for (const state of states) {
    if (!state.guildId) continue;
    const member = await accessService.requireMember(actorId, state.guildId).then(() => true).catch(() => false);
    if (member) return state;
  }

  return states[0] ?? null;
}
