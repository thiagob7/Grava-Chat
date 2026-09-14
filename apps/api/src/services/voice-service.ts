import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import type { VoiceState, VoiceServer, VoiceDevice } from "@gravae/shared";
import { has, rooms } from "@gravae/shared";
import { env } from "~/env.js";
import { AppError, ConflictError, ForbiddenError } from "~/lib/http.js";
import { isOtherTab } from "~/lib/retomada.js";
import { redis, keys } from "~/lib/redis.js";
import { userRepository } from "~/repositories/user-repository.js";
import {
  channelRepository,
  guildRepository,
  memberRepository,
} from "~/repositories/guild-repository.js";
import type { Context } from "./access-service.js";
import { accessService } from "./access-service.js";

export const roomName = (channelId: string) => `channel-${channelId}`;
const roomChannel = (roomName: string) => roomName.replace(/^channel-/, "");

const isObjectId = (value: string) => /^[0-9a-f]{24}$/i.test(value);

const isPrivateCall = (channel: { guildId: string | null }) => channel.guildId === null;

export async function voiceRecipients(state: {
  guildId: string | null;
  channelId: string;
}): Promise<string[]> {
  if (state.guildId) return [rooms.channel(state.channelId)];

  const channel = await channelRepository.findById(state.channelId);
  return (channel?.recipients ?? []).map(rooms.user);
}

const timeoutThis = (member: { timeoutUntil: Date | null } | null | undefined) =>
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

const ORPHAN_MS_TTL = 60_000;

const STATE_S_TTL = 12 * 60 * 60;

const SFU_MS_GRACE = 25_000;

export function fontsCanPublish(
  canSpeak: boolean,
  context: Pick<Context, "permissions"> | null | undefined,
) {
  const fonts: TrackSource[] = [];

  if (canSpeak) fonts.push(TrackSource.MICROPHONE);
  if (!context || has(context.permissions, "VIDEO")) fonts.push(TrackSource.CAMERA);
  if (!context || has(context.permissions, "SHARE_SCREEN")) {
    fonts.push(TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO);
  }

  return fonts;
}

async function statesInVoice(): Promise<VoiceState[]> {
  const ids = await redis.smembers(keys.voicePeople);
  if (!ids.length) return [];

  const raw = await redis.mget(ids.map((id) => keys.voiceState(id)));

  const gone = ids.filter((_, i) => raw[i] === null);
  if (gone.length) await redis.srem(keys.voicePeople, ...gone);

  return raw
    .filter((v): v is string => Boolean(v))
    .map((v) => hydrate(JSON.parse(v) as VoiceState));
}

export const slotFor = (userId: string, guildId: string | null, isBot = false) =>
  isBot && guildId ? `${userId}@${guildId}` : userId;

async function slotOfState(state: VoiceState) {
  if (!state.guildId) return state.userId;

  const botSlot = `${state.userId}@${state.guildId}`;
  return (await redis.sismember(keys.voiceSlots(state.userId), botSlot)) ? botSlot : state.userId;
}

async function writeState(state: VoiceState) {
  const raw = JSON.stringify(state);
  const slot = await slotOfState(state);

  if (state.orphanedAt) await redis.set(keys.voiceState(slot), raw, "KEEPTTL");
  else await redis.set(keys.voiceState(slot), raw, "EX", STATE_S_TTL);
}

async function leaveSlot(slot: string, onlyIfSocket?: string): Promise<VoiceState | null> {
  const raw = await redis.get(keys.voiceState(slot));
  if (!raw) return null;

  const state = hydrate(JSON.parse(raw) as VoiceState);
  if (onlyIfSocket && state.socketId !== onlyIfSocket) return null;

  await redis
    .multi()
    .del(keys.voiceState(slot))
    .srem(keys.voiceChannel(state.channelId), slot)
    .srem(keys.voicePeople, slot)
    .srem(keys.voiceSlots(state.userId), slot)
    .exec();

  return state;
}

async function liveMembers(channelId: string): Promise<string[]> {
  const ids = await redis.smembers(keys.voiceChannel(channelId));
  if (!ids.length) return [];

  const raw = await redis.mget(ids.map((id) => keys.voiceState(id)));

  const live = ids.filter((_, i) => {
    const value = raw[i];
    return value !== null && value !== undefined && (JSON.parse(value) as VoiceState).channelId === channelId;
  });

  const stale = ids.filter((id) => !live.includes(id));
  if (stale.length) await redis.srem(keys.voiceChannel(channelId), ...stale);

  return live;
}

export const voiceService = {
  async sfuState() {
    const [rooms, inRedis] = await Promise.all([roomService().listRooms(), statesInVoice()]);

    const withFolks = await Promise.all(
      rooms.map(async (room) => ({
        room,
        people: await roomService()
          .listParticipants(room.name)
          .catch(() => []),
      })),
    );

    const sfuInside = new Set(
      withFolks.flatMap(({ room, people }) =>
        people.map((p) => `${roomChannel(room.name)}:${p.identity}`),
      ),
    );
    const knownByApp = new Set(inRedis.map((e) => `${e.channelId}:${e.userId}`));

    const now = Date.now();
    const ghosts = inRedis.filter(
      (e) =>
        now - e.joinedAt > SFU_MS_GRACE &&
        !sfuInside.has(`${e.channelId}:${e.userId}`),
    );

    const channels = await channelRepository.findManyByIds(
      [
        ...new Set([
          ...rooms.map((s) => roomChannel(s.name)),
          ...ghosts.map((f) => f.channelId),
        ]),
      ].filter(isObjectId),
    );

    const guildByChannel = new Map<string, string>();
    for (const state of inRedis) {
      if (state.guildId) guildByChannel.set(state.channelId, state.guildId);
    }

    const guilds = await guildRepository.findManyByIds([
      ...new Set([
        ...channels.map((c) => c.guildId).filter((id): id is string => Boolean(id)),
        ...guildByChannel.values(),
      ]),
    ]);

    const users = await userRepository.findManyByIds(
      [
        ...new Set([
          ...withFolks.flatMap(({ people }) => people.map((p) => p.identity)),
          ...channels.filter((c) => c.guildId === null).flatMap((c) => c.recipients),
          ...ghosts.map((f) => f.userId),
        ]),
      ].filter(isObjectId),
    );

    const channelById = new Map(channels.map((c) => [c.id, c]));
    const guildById = new Map(guilds.map((g) => [g.id, g]));
    const userById = new Map(users.map((u) => [u.id, u]));

    const channelName = (channelId: string) => {
      const channel = channelById.get(channelId);
      if (!channel) return channelId;

      if (channel.guildId === null)
        return channel.recipients
          .map((id) => userById.get(id)?.displayName ?? "alguém")
          .join(" e ");

      return channel.name;
    };

    const detailed = withFolks.map(({ room, people }) => {
      const channelId = roomChannel(room.name);
      const channel = channelById.get(channelId);
      const guildId = channel?.guildId ?? guildByChannel.get(channelId) ?? null;
      const guild = guildId ? guildById.get(guildId) : null;

      const someoneFromhere = people.some((p) => userById.has(p.identity));
      const reason: "canal-apagado" | "outro-ambiente" | null = channel
        ? null
        : people.length > 0 && !someoneFromhere
          ? "outro-ambiente"
          : "canal-apagado";

      return {
        channelId,
        name: channel ? channelName(channelId) : null,
        server: guild?.name ?? null,
        isPrivate: channel?.guildId === null,
        reason,
        createdAt: Number(room.creationTime),
        participants: people.map((p) => {
          const trail = (font: TrackSource) => p.tracks.find((t) => t.source === font);
          const microphone = trail(TrackSource.MICROPHONE);
          const camera = trail(TrackSource.CAMERA);
          const display = trail(TrackSource.SCREEN_SHARE);
          const user = userById.get(p.identity);

          return {
            id: p.identity,
            name: user?.displayName ?? (p.name || p.identity),
            avatarUrl: user?.avatarUrl ?? null,
            microphone: microphone ? (microphone.muted ? "mudo" : "aberto") : "sem",
            camera: Boolean(camera && !camera.muted),
            display: Boolean(display && !display.muted),
            joinedAt: Number(p.joinedAt),
            soNoSfu: !knownByApp.has(`${channelId}:${p.identity}`),
          };
        }),
      };
    });

    return {
      rooms: detailed,
      participants: detailed.reduce((total, s) => total + s.participants.length, 0),
      publishing: detailed.reduce(
        (total, s) => total + s.participants.filter((p) => p.microphone === "aberto").length,
        0,
      ),
      ghosts: ghosts.map((e) => ({
        id: e.userId,
        name: userById.get(e.userId)?.displayName ?? e.userId,
        channel: channelById.has(e.channelId) ? channelName(e.channelId) : null,
        since: Math.round(e.joinedAt / 1000),
        awaitingBack: e.orphanedAt !== null,
      })),
    };
  },

  async moderate(
    state: VoiceState,
    patch: { serverMute?: boolean; serverDeaf?: boolean },
  ): Promise<VoiceState | null> {
    if (patch.serverMute !== undefined) {
      await voiceService.muteSfu(state.channelId, state.userId, patch.serverMute);
    }

    const next: VoiceState = { ...state, ...patch };
    await writeState(next);

    return next;
  },

  async muteSfu(channelId: string, userId: string, isMuted: boolean) {
    const room = roomName(channelId);
    const participants = await roomService().listParticipants(room);
    const target = participants.find((p) => p.identity === userId);

    if (!target) throw new AppError("Essa pessoa não está mais na chamada", 409);

    const microphones = target.tracks.filter((t) => t.source === TrackSource.MICROPHONE);

    if (!microphones.length) {
      if (isMuted) return;
      throw new AppError("Não achei o microfone dessa pessoa na chamada", 409);
    }

    for (const track of microphones) {
      await roomService().mutePublishedTrack(room, userId, track.sid, isMuted);
    }
  },

  async sfuDisconnect(channelId: string, userId: string) {
    await roomService()
      .removeParticipant(roomName(channelId), userId)
      .catch(() => undefined);
  },

  async issueToken(userId: string, channelId: string, isBot = false) {
    const { channel, context } = await accessService.requireChannelAccess(userId, channelId);
    const anterior = await voiceService.get(userId, { guildId: channel.guildId, isBot });

    if (channel.type !== "VOICE" && !isPrivateCall(channel)) {
      throw new AppError("Este canal não é de voz");
    }
    if (context && !has(context.permissions, "CONNECT")) {
      throw new ForbiddenError("Você não pode entrar neste canal de voz");
    }

    if (channel.userLimit > 0 && anterior?.channelId !== channelId) {
      const inside = await liveMembers(channelId);
      if (inside.length >= channel.userLimit) throw new AppError("Este canal de voz está cheio", 403);
    }

    const user = await userRepository.findByIdOrThrow(userId);

    const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity: user.id,
      name: user.displayName,
      metadata: JSON.stringify({ avatarUrl: user.avatarUrl }),
      ttl: "10m",
    });

    const canSpeak =
      !context ||
      (has(context.permissions, "SPEAK") &&
        !timeoutThis(context.member) &&
        !(anterior?.channelId === channelId && anterior.serverMute));

    const fonts = fontsCanPublish(canSpeak, context);

    token.addGrant({
      room: roomName(channelId),
      roomJoin: true,
      canPublish: fonts.length > 0,
      canPublishSources: fonts,
      canSubscribe: true,
      canPublishData: true,
    });

    const requiresPushToTalk = Boolean(context) && !has(context!.permissions, "USE_VAD");

    return {
      url: env.LIVEKIT_URL,
      token: await token.toJwt(),
      requiresPushToTalk,
      bitrate: channel.bitrate,
    };
  },

  async join(
    userId: string,
    channelId: string,
    socketId: string,
    resume = false,
    clientId: string | null = null,
    device: VoiceDevice | null = null,
    isBot = false,
  ) {
    const { channel, context } = await accessService.requireChannelAccess(userId, channelId);
    if (channel.type !== "VOICE" && !isPrivateCall(channel)) {
      throw new AppError("Este canal não é de voz");
    }
    if (context && !has(context.permissions, "CONNECT")) {
      throw new ForbiddenError("Você não pode entrar neste canal de voz");
    }

    const slot = slotFor(userId, channel.guildId, isBot);
    const previous = await voiceService.get(userId, { guildId: channel.guildId, isBot });

    if (channel.userLimit > 0 && previous?.channelId !== channelId) {
      const inside = await liveMembers(channelId);
      if (inside.length >= channel.userLimit) throw new AppError("Este canal de voz está cheio", 403);
    }

    if (isOtherTab({ resuming: resume, anterior: previous, channelRequest: channelId, client: clientId })) {
      throw new AppError("Outra aba está nesta chamada");
    }

    const left = previous && previous.channelId !== channelId ? await leaveSlot(slot) : null;

    const state: VoiceState = {
      userId,
      channelId,
      guildId: channel.guildId,
      socketId,
      clientId: clientId ?? previous?.clientId ?? null,
      ...DEFAULTS,
      joinedAt: previous?.channelId === channelId ? previous.joinedAt : Date.now(),
      selfMute: previous?.selfMute ?? DEFAULTS.selfMute,
      selfDeaf: previous?.selfDeaf ?? DEFAULTS.selfDeaf,
      serverMute: previous?.serverMute ?? false,
      serverDeaf: previous?.serverDeaf ?? false,
      orphanedAt: null,
      device: device ?? previous?.device ?? null,
    };

    const multi = redis
      .multi()
      .set(keys.voiceState(slot), JSON.stringify(state), "EX", STATE_S_TTL)
      .sadd(keys.voiceChannel(channelId), slot)
      .sadd(keys.voicePeople, slot);

    if (slot !== userId) multi.sadd(keys.voiceSlots(userId), slot).expire(keys.voiceSlots(userId), STATE_S_TTL);

    await multi.exec();

    return { state, left };
  },

  async orphan(userId: string, socketId: string): Promise<VoiceState[]> {
    const states = (await voiceService.statesOf(userId)).filter((s) => s.socketId === socketId && !s.orphanedAt);

    return Promise.all(
      states.map(async (state) => {
        const orphaned = { ...state, orphanedAt: Date.now() };
        await redis.set(keys.voiceState(await slotOfState(state)), JSON.stringify(orphaned), "PX", ORPHAN_MS_TTL);
        return orphaned;
      }),
    );
  },

  async reapOrphan(userId: string, socketId: string): Promise<VoiceState[]> {
    const states = (await voiceService.statesOf(userId)).filter((s) => s.socketId === socketId && s.orphanedAt);
    const left = await Promise.all(states.map(async (state) => leaveSlot(await slotOfState(state), socketId)));

    return left.filter((s): s is VoiceState => Boolean(s));
  },

  async leave(
    userId: string,
    onlyIfSocket?: string,
    scope?: { guildId: string | null; isBot?: boolean },
  ): Promise<VoiceState | null> {
    return leaveSlot(slotFor(userId, scope?.guildId ?? null, scope?.isBot), onlyIfSocket);
  },

  async leaveState(state: VoiceState): Promise<VoiceState | null> {
    return leaveSlot(await slotOfState(state));
  },

  async update(
    userId: string,
    patch: Partial<Pick<VoiceState, "selfMute" | "selfDeaf" | "camera" | "screenShare">>,
  ) {
    const state = await voiceService.get(userId);
    if (!state) throw new ConflictError("Você não está num canal de voz");

    const next = { ...state, ...patch };
    await writeState(next);
    return next;
  },

  async get(userId: string, scope?: { guildId: string | null; isBot?: boolean }): Promise<VoiceState | null> {
    const raw = await redis.get(keys.voiceState(slotFor(userId, scope?.guildId ?? null, scope?.isBot)));
    return raw ? hydrate(JSON.parse(raw) as VoiceState) : null;
  },

  async statesOf(userId: string): Promise<VoiceState[]> {
    const slots = [userId, ...(await redis.smembers(keys.voiceSlots(userId)))];
    const raw = await redis.mget(slots.map((slot) => keys.voiceState(slot)));

    return raw.filter((v): v is string => Boolean(v)).map((v) => hydrate(JSON.parse(v) as VoiceState));
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
      if (value) byUser.set(id, hydrate(JSON.parse(value) as VoiceState));
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

  async statesForUser(userId: string): Promise<Record<string, VoiceServer[]>> {
    const members = await memberRepository.guildIdsOf(userId);
    const guildIds = members.map((m) => m.guildId);
    if (!guildIds.length) return {};

    const visible = new Set(await accessService.listenableChannels(userId, guildIds));
    const channels = (await channelRepository.voiceChannelsOfGuilds(guildIds)).filter((c) => visible.has(c.id));
    if (!channels.length) return {};

    const states = await voiceService.statesForChannels(channels.map((c) => c.id));

    const ids = [...new Set(Object.values(states).flatMap((list) => list.map((e) => e.userId)))];
    const users = new Map(
      (await userRepository.findManyByIds(ids)).map((u) => [
        u.id,
        { userId: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl },
      ]),
    );

    const byServer: Record<string, VoiceServer[]> = {};

    for (const channel of channels) {
      const guildId = channel.guildId;
      const inside = states[channel.id] ?? [];
      if (!guildId || !inside.length) continue;

      const people = inside
        .map((state) => users.get(state.userId))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));

      if (!people.length) continue;

      (byServer[guildId] ??= []).push({
        channelId: channel.id,
        channelName: channel.name,
        broadcasting: inside.some((state) => state.screenShare),
        people,
      });
    }

    return byServer;
  },

  async reconcile(): Promise<{ fromRedis: VoiceState[]; fromSfu: number }> {
    const now = Date.now();

    const [inRedis, rooms] = await Promise.all([
      statesInVoice(),
      roomService().listRooms().catch(() => []),
    ]);

    const our = rooms.filter((room) => room.name.startsWith("channel-"));

    const participants = await Promise.all(
      our.map(async (room) => ({
        channelId: room.name.slice("channel-".length),
        room: room.name,
        list: await roomService().listParticipants(room.name).catch(() => []),
      })),
    );

    const inSfu = new Set<string>();
    for (const { channelId, list } of participants) {
      for (const p of list) inSfu.add(`${channelId}:${p.identity}`);
    }

    const orphans = inRedis.filter(
      (e) => now - e.joinedAt > SFU_MS_GRACE && !inSfu.has(`${e.channelId}:${e.userId}`),
    );

    const fromRedis = (await Promise.all(orphans.map((e) => voiceService.leaveState(e)))).filter(
      (e): e is VoiceState => Boolean(e),
    );

    const known = new Set(inRedis.map((e) => `${e.channelId}:${e.userId}`));

    const zombies = participants.flatMap(({ channelId, room, list }) => {
      const our = list.some((p) => known.has(`${channelId}:${p.identity}`));
      if (!our) return [];

      return list
        .filter((p) => {
          if (known.has(`${channelId}:${p.identity}`)) return false;
          const joinedAt = Number(p.joinedAt ?? 0) * 1000;
          return joinedAt > 0 && now - joinedAt > SFU_MS_GRACE;
        })
        .map((p) => ({ room, identity: p.identity }));
    });

    await Promise.all(
      zombies.map(({ room, identity }) =>
        roomService().removeParticipant(room, identity).catch(() => undefined),
      ),
    );

    return { fromRedis, fromSfu: zombies.length };
  },

  async reset() {
    const stale = await redis.keys("voice:*");
    if (stale.length) await redis.del(...stale);
  },
};

function hydrate(state: VoiceState): VoiceState {
  return { ...state, joinedAt: state.joinedAt ?? Date.now() };
}

