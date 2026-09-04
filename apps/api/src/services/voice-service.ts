import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import type { VoiceState, VozNoServidor } from "@gravae/shared";
import { has, rooms } from "@gravae/shared";
import { env } from "~/env.js";
import { AppError, ForbiddenError } from "~/lib/http.js";
import { ehOutraAba } from "~/lib/retomada.js";
import { redis, keys } from "~/lib/redis.js";
import { userRepository } from "~/repositories/user-repository.js";
import {
  channelRepository,
  guildRepository,
  memberRepository,
} from "~/repositories/guild-repository.js";
import { accessService } from "./access-service.js";

export const roomName = (channelId: string) => `channel-${channelId}`;
const canalDaSala = (nomeDaSala: string) => nomeDaSala.replace(/^channel-/, "");

const ehObjectId = (valor: string) => /^[0-9a-f]{24}$/i.test(valor);

const ehChamadaDePrivado = (channel: { guildId: string | null }) => channel.guildId === null;

export async function destinatariosDaVoz(state: {
  guildId: string | null;
  channelId: string;
}): Promise<string[]> {
  if (state.guildId) return [rooms.guild(state.guildId)];

  const channel = await channelRepository.findById(state.channelId);
  return (channel?.recipients ?? []).map(rooms.user);
}

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

const TTL_DO_ORFAO_MS = 60_000;

const CARENCIA_DO_SFU_MS = 25_000;

export const voiceService = {
  async estadoDoSfu() {
    const [salas, chaves] = await Promise.all([
      roomService().listRooms(),
      redis.keys("voice:user:*"),
    ]);

    const brutos = chaves.length ? await redis.mget(chaves) : [];
    const noRedis = brutos
      .filter((v): v is string => Boolean(v))
      .map((v) => hidratar(JSON.parse(v) as VoiceState));

    const comGente = await Promise.all(
      salas.map(async (sala) => ({
        sala,
        pessoas: await roomService()
          .listParticipants(sala.name)
          .catch(() => []),
      })),
    );

    const dentroDoSfu = new Set(
      comGente.flatMap(({ sala, pessoas }) =>
        pessoas.map((p) => `${canalDaSala(sala.name)}:${p.identity}`),
      ),
    );
    const conhecidosPeloApp = new Set(noRedis.map((e) => `${e.channelId}:${e.userId}`));

    const agora = Date.now();
    const fantasmas = noRedis.filter(
      (e) =>
        agora - e.joinedAt > CARENCIA_DO_SFU_MS &&
        !dentroDoSfu.has(`${e.channelId}:${e.userId}`),
    );

    const canais = await channelRepository.findManyByIds(
      [
        ...new Set([
          ...salas.map((s) => canalDaSala(s.name)),
          ...fantasmas.map((f) => f.channelId),
        ]),
      ].filter(ehObjectId),
    );

    const guildPorCanal = new Map<string, string>();
    for (const estado of noRedis) {
      if (estado.guildId) guildPorCanal.set(estado.channelId, estado.guildId);
    }

    const guilds = await guildRepository.findManyByIds([
      ...new Set([
        ...canais.map((c) => c.guildId).filter((id): id is string => Boolean(id)),
        ...guildPorCanal.values(),
      ]),
    ]);

    const usuarios = await userRepository.findManyByIds(
      [
        ...new Set([
          ...comGente.flatMap(({ pessoas }) => pessoas.map((p) => p.identity)),
          ...canais.filter((c) => c.guildId === null).flatMap((c) => c.recipients),
          ...fantasmas.map((f) => f.userId),
        ]),
      ].filter(ehObjectId),
    );

    const canalPorId = new Map(canais.map((c) => [c.id, c]));
    const guildPorId = new Map(guilds.map((g) => [g.id, g]));
    const usuarioPorId = new Map(usuarios.map((u) => [u.id, u]));

    const nomeDoCanal = (canalId: string) => {
      const canal = canalPorId.get(canalId);
      if (!canal) return canalId;

      if (canal.guildId === null)
        return canal.recipients
          .map((id) => usuarioPorId.get(id)?.displayName ?? "alguém")
          .join(" e ");

      return canal.name;
    };

    const detalhadas = comGente.map(({ sala, pessoas }) => {
      const canalId = canalDaSala(sala.name);
      const canal = canalPorId.get(canalId);
      const guildId = canal?.guildId ?? guildPorCanal.get(canalId) ?? null;
      const guild = guildId ? guildPorId.get(guildId) : null;

      const alguemDaqui = pessoas.some((p) => usuarioPorId.has(p.identity));
      const motivo: "canal-apagado" | "outro-ambiente" | null = canal
        ? null
        : pessoas.length > 0 && !alguemDaqui
          ? "outro-ambiente"
          : "canal-apagado";

      return {
        canalId,
        nome: canal ? nomeDoCanal(canalId) : null,
        servidor: guild?.name ?? null,
        ehPrivado: canal?.guildId === null,
        motivo,
        criadaEm: Number(sala.creationTime),
        participantes: pessoas.map((p) => {
          const trilha = (fonte: TrackSource) => p.tracks.find((t) => t.source === fonte);
          const microfone = trilha(TrackSource.MICROPHONE);
          const camera = trilha(TrackSource.CAMERA);
          const tela = trilha(TrackSource.SCREEN_SHARE);
          const user = usuarioPorId.get(p.identity);

          return {
            id: p.identity,
            nome: user?.displayName ?? (p.name || p.identity),
            avatarUrl: user?.avatarUrl ?? null,
            microfone: microfone ? (microfone.muted ? "mudo" : "aberto") : "sem",
            camera: Boolean(camera && !camera.muted),
            tela: Boolean(tela && !tela.muted),
            entrouEm: Number(p.joinedAt),
            soNoSfu: !conhecidosPeloApp.has(`${canalId}:${p.identity}`),
          };
        }),
      };
    });

    return {
      salas: detalhadas,
      participantes: detalhadas.reduce((total, s) => total + s.participantes.length, 0),
      publicando: detalhadas.reduce(
        (total, s) => total + s.participantes.filter((p) => p.microfone === "aberto").length,
        0,
      ),
      fantasmas: fantasmas.map((e) => ({
        id: e.userId,
        nome: usuarioPorId.get(e.userId)?.displayName ?? e.userId,
        canal: canalPorId.has(e.channelId) ? nomeDoCanal(e.channelId) : null,
        desde: Math.round(e.joinedAt / 1000),
        aguardandoVolta: e.orphanedAt !== null,
      })),
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

    if (channel.type !== "VOICE" && !ehChamadaDePrivado(channel)) {
      throw new AppError("Este canal não é de voz");
    }
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

  async join(
    userId: string,
    channelId: string,
    socketId: string,
    resume = false,
    clienteId: string | null = null,
  ) {
    const { channel } = await accessService.requireChannelAccess(userId, channelId);
    if (channel.type !== "VOICE" && !ehChamadaDePrivado(channel)) {
      throw new AppError("Este canal não é de voz");
    }

    const previous = await voiceService.get(userId);

    if (channel.userLimit > 0 && previous?.channelId !== channelId) {
      const dentro = await redis.scard(keys.voiceChannel(channelId));
      if (dentro >= channel.userLimit) throw new AppError("Este canal de voz está cheio", 403);
    }

    if (ehOutraAba({ retomando: resume, anterior: previous, canalPedido: channelId, cliente: clienteId })) {
      throw new AppError("Outra aba está nesta chamada");
    }

    const left = previous && previous.channelId !== channelId ? await voiceService.leave(userId) : null;

    const state: VoiceState = {
      userId,
      channelId,
      guildId: channel.guildId,
      socketId,
      clienteId: clienteId ?? previous?.clienteId ?? null,
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
    await redis.set(keys.voiceState(userId), JSON.stringify(orphaned), "PX", TTL_DO_ORFAO_MS);
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

  async statesForUser(userId: string): Promise<Record<string, VozNoServidor[]>> {
    const membros = await memberRepository.guildIdsOf(userId);
    const guildIds = membros.map((m) => m.guildId);
    if (!guildIds.length) return {};

    const canais = await channelRepository.voiceChannelsOfGuilds(guildIds);
    if (!canais.length) return {};

    const estados = await voiceService.statesForChannels(canais.map((c) => c.id));

    const ids = [...new Set(Object.values(estados).flatMap((lista) => lista.map((e) => e.userId)))];
    const usuarios = new Map(
      (await userRepository.findManyByIds(ids)).map((u) => [
        u.id,
        { userId: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl },
      ]),
    );

    const porServidor: Record<string, VozNoServidor[]> = {};

    for (const canal of canais) {
      const guildId = canal.guildId;
      const dentro = estados[canal.id] ?? [];
      if (!guildId || !dentro.length) continue;

      const pessoas = dentro
        .map((estado) => usuarios.get(estado.userId))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));

      if (!pessoas.length) continue;

      (porServidor[guildId] ??= []).push({
        channelId: canal.id,
        channelName: canal.name,
        transmitindo: dentro.some((estado) => estado.screenShare),
        pessoas,
      });
    }

    return porServidor;
  },

  async reconciliar(): Promise<{ doRedis: VoiceState[]; doSfu: number }> {
    const agora = Date.now();

    const [chaves, salas] = await Promise.all([
      redis.keys("voice:user:*"),
      roomService().listRooms().catch(() => []),
    ]);

    const brutos = chaves.length ? await redis.mget(chaves) : [];
    const noRedis = brutos
      .filter((v): v is string => Boolean(v))
      .map((v) => hidratar(JSON.parse(v) as VoiceState));

    const nossas = salas.filter((sala) => sala.name.startsWith("channel-"));

    const participantes = await Promise.all(
      nossas.map(async (sala) => ({
        channelId: sala.name.slice("channel-".length),
        sala: sala.name,
        lista: await roomService().listParticipants(sala.name).catch(() => []),
      })),
    );

    const noSfu = new Set<string>();
    for (const { channelId, lista } of participantes) {
      for (const p of lista) noSfu.add(`${channelId}:${p.identity}`);
    }

    const orfaos = noRedis.filter(
      (e) => agora - e.joinedAt > CARENCIA_DO_SFU_MS && !noSfu.has(`${e.channelId}:${e.userId}`),
    );

    const doRedis = (await Promise.all(orfaos.map((e) => voiceService.leave(e.userId)))).filter(
      (e): e is VoiceState => Boolean(e),
    );

    const conhecidos = new Set(noRedis.map((e) => `${e.channelId}:${e.userId}`));

    const zumbis = participantes.flatMap(({ channelId, sala, lista }) => {
      const nossa = lista.some((p) => conhecidos.has(`${channelId}:${p.identity}`));
      if (!nossa) return [];

      return lista
        .filter((p) => {
          if (conhecidos.has(`${channelId}:${p.identity}`)) return false;
          const entrouEm = Number(p.joinedAt ?? 0) * 1000;
          return entrouEm > 0 && agora - entrouEm > CARENCIA_DO_SFU_MS;
        })
        .map((p) => ({ sala, identity: p.identity }));
    });

    await Promise.all(
      zumbis.map(({ sala, identity }) =>
        roomService().removeParticipant(sala, identity).catch(() => undefined),
      ),
    );

    return { doRedis, doSfu: zumbis.length };
  },

  async reset() {
    const stale = await redis.keys("voice:*");
    if (stale.length) await redis.del(...stale);
  },
};

function hidratar(state: VoiceState): VoiceState {
  return { ...state, joinedAt: state.joinedAt ?? Date.now() };
}

