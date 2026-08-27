import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import type { VoiceState } from "@gravae/shared";
import { has } from "@gravae/shared";
import { env } from "~/env.js";
import { AppError, ForbiddenError } from "~/lib/http.js";
import { redis, keys } from "~/lib/redis.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "./access-service.js";

export const roomName = (channelId: string) => `channel-${channelId}`;

const estaDeCastigo = (member: { timeoutUntil: Date | null } | null | undefined) =>
  Boolean(member?.timeoutUntil && member.timeoutUntil > new Date());

let sfu: RoomServiceClient | null = null;

function roomService() {
  sfu ??= new RoomServiceClient(
    env.LIVEKIT_URL.replace(/^ws/, "http"),
    env.LIVEKIT_API_KEY,
    env.LIVEKIT_API_SECRET,
  );

  return sfu;
}

const DEFAULTS = {
  selfMute: false,
  selfDeaf: false,
  serverMute: false,
  serverDeaf: false,
  camera: false,
  screenShare: false,
};

export const VOICE_GRACE_MS = 6_000;

export const voiceService = {
  /*
    Radiografia do SFU pro painel: quantas salas abertas e quanta gente dentro.

    Pergunta ao próprio LiveKit, não ao Redis, de propósito — o Redis guarda o
    que a NOSSA aplicação acha que está acontecendo, e a graça do painel é
    justamente pegar divergência entre os dois.
  */
  async estadoDoSfu() {
    const salas = await roomService().listRooms();

    return {
      salas: salas.map((s) => ({
        nome: s.name,
        participantes: s.numParticipants,
        publicando: s.numPublishers,
        criadaEm: Number(s.creationTime),
      })),
      participantes: salas.reduce((total, s) => total + s.numParticipants, 0),
    };
  },

  async moderar(
    alvoId: string,
    patch: { serverMute?: boolean; serverDeaf?: boolean },
  ): Promise<VoiceState | null> {
    const state = await voiceService.get(alvoId);
    if (!state) return null;

    const proximo: VoiceState = { ...state, ...patch };
    await redis.set(keys.voiceState(alvoId), JSON.stringify(proximo));

    if (patch.serverMute !== undefined) {
      await voiceService.mutarNoSfu(state.channelId, alvoId, patch.serverMute).catch(() => undefined);
    }

    return proximo;
  },

  async mutarNoSfu(channelId: string, userId: string, mudo: boolean) {
    const sala = roomName(channelId);
    const participantes = await roomService().listParticipants(sala);
    const alvo = participantes.find((p) => p.identity === userId);

    for (const track of alvo?.tracks ?? []) {
      if (track.source === TrackSource.MICROPHONE) {
        await roomService().mutePublishedTrack(sala, userId, track.sid, mudo);
      }
    }
  },

  async desconectarDoSfu(channelId: string, userId: string) {
    await roomService()
      .removeParticipant(roomName(channelId), userId)
      .catch(() => undefined);
  },

  async issueToken(userId: string, channelId: string) {
    const { channel, contexto } = await accessService.requireChannelAccess(userId, channelId);
    const anterior = await voiceService.get(userId);

    if (channel.type !== "VOICE") throw new AppError("Este canal não é de voz");
    if (contexto && !has(contexto.permissions, "CONNECT")) {
      throw new ForbiddenError("Você não pode entrar neste canal de voz");
    }

    const user = await userRepository.findByIdOrThrow(userId);

    const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity: user.id,
      name: user.displayName,
      metadata: JSON.stringify({ avatarUrl: user.avatarUrl }),
      ttl: "10m",
    });

    token.addGrant({
      room: roomName(channelId),
      roomJoin: true,
      canPublish:
        !contexto ||
        (has(contexto.permissions, "SPEAK") &&
          !estaDeCastigo(contexto.member) &&
          !(anterior?.channelId === channelId && anterior.serverMute)),
      canSubscribe: true,
      canPublishData: true,
    });

    const exigePushToTalk = Boolean(contexto) && !has(contexto!.permissions, "USE_VAD");

    return { url: env.LIVEKIT_URL, token: await token.toJwt(), exigePushToTalk };
  },

  async join(userId: string, channelId: string, socketId: string, resume = false) {
    const { channel } = await accessService.requireChannelAccess(userId, channelId);
    if (channel.type !== "VOICE") throw new AppError("Este canal não é de voz");
    if (!channel.guildId) throw new AppError("Canal de voz inválido");

    const previous = await voiceService.get(userId);

    if (channel.userLimit > 0 && previous?.channelId !== channelId) {
      const dentro = await redis.scard(keys.voiceChannel(channelId));
      if (dentro >= channel.userLimit) throw new AppError("Este canal de voz está cheio", 403);
    }

    if (resume && previous && previous.channelId === channelId && !previous.orphanedAt) {
      throw new AppError("Outra aba está nesta chamada");
    }
    const left = previous && previous.channelId !== channelId ? await voiceService.leave(userId) : null;

    const state: VoiceState = {
      userId,
      channelId,
      guildId: channel.guildId,
      socketId,
      ...DEFAULTS,
      joinedAt: previous?.channelId === channelId ? previous.joinedAt : Date.now(),
      selfMute: previous?.selfMute ?? DEFAULTS.selfMute,
      selfDeaf: previous?.selfDeaf ?? DEFAULTS.selfDeaf,
      serverMute: previous?.serverMute ?? false,
      serverDeaf: previous?.serverDeaf ?? false,
      orphanedAt: null,
    };

    await redis
      .multi()
      .set(keys.voiceState(userId), JSON.stringify(state))
      .sadd(keys.voiceChannel(channelId), userId)
      .exec();

    return { state, left };
  },

  async orphan(userId: string, socketId: string): Promise<VoiceState | null> {
    const state = await voiceService.get(userId);
    if (!state || state.socketId !== socketId || state.orphanedAt) return null;

    const orphaned = { ...state, orphanedAt: Date.now() };
    await redis.set(keys.voiceState(userId), JSON.stringify(orphaned));
    return orphaned;
  },

  async reapOrphan(userId: string, socketId: string): Promise<VoiceState | null> {
    const state = await voiceService.get(userId);
    if (!state || state.socketId !== socketId || !state.orphanedAt) return null;

    return voiceService.leave(userId, socketId);
  },

  async leave(userId: string, onlyIfSocket?: string): Promise<VoiceState | null> {
    const state = await voiceService.get(userId);
    if (!state) return null;
    if (onlyIfSocket && state.socketId !== onlyIfSocket) return null;

    await redis
      .multi()
      .del(keys.voiceState(userId))
      .srem(keys.voiceChannel(state.channelId), userId)
      .exec();

    return state;
  },

  async update(
    userId: string,
    patch: Partial<Pick<VoiceState, "selfMute" | "selfDeaf" | "camera" | "screenShare">>,
  ) {
    const state = await voiceService.get(userId);
    if (!state) throw new AppError("Você não está num canal de voz");

    const next = { ...state, ...patch };
    await redis.set(keys.voiceState(userId), JSON.stringify(next));
    return next;
  },

  async get(userId: string): Promise<VoiceState | null> {
    const raw = await redis.get(keys.voiceState(userId));
    return raw ? hidratar(JSON.parse(raw) as VoiceState) : null;
  },

  async statesForChannels(channelIds: string[]): Promise<Record<string, VoiceState[]>> {
    if (!channelIds.length) return {};

    const memberships = await Promise.all(channelIds.map((id) => redis.smembers(keys.voiceChannel(id))));
    const userIds = [...new Set(memberships.flat())];
    if (!userIds.length) return Object.fromEntries(channelIds.map((id) => [id, []]));

    const raw = await redis.mget(userIds.map((id) => keys.voiceState(id)));
    const byUser = new Map<string, VoiceState>();

    userIds.forEach((id, i) => {
      const value = raw[i];
      if (value) byUser.set(id, hidratar(JSON.parse(value) as VoiceState));
    });

    return Object.fromEntries(
      channelIds.map((channelId, i) => [
        channelId,
        (memberships[i] ?? [])
          .map((u) => byUser.get(u))
          .filter((s): s is VoiceState => Boolean(s) && s!.channelId === channelId),
      ]),
    );
  },

  async reset() {
    const stale = await redis.keys("voice:*");
    if (stale.length) await redis.del(...stale);
  },
};

function hidratar(state: VoiceState): VoiceState {
  return { ...state, joinedAt: state.joinedAt ?? Date.now() };
}

