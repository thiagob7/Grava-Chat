import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import type { VoiceState } from "@gravae/shared";
import { has } from "@gravae/shared";
import { env } from "~/env.js";
import { AppError, ForbiddenError } from "~/lib/http.js";
import { redis, keys } from "~/lib/redis.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "./access-service.js";

/**
 * Nome da sala = id do canal. A sala nasce e morre junto com o canal, sem
 * nenhuma tabela de "salas ativas" pra manter em sincronia.
 */
export const roomName = (channelId: string) => `channel-${channelId}`;

/** De castigo entra na chamada, mas entra mudo — e o mudo vem do token. */
const estaDeCastigo = (member: { timeoutUntil: Date | null } | null | undefined) =>
  Boolean(member?.timeoutUntil && member.timeoutUntil > new Date());

/**
 * Cliente da API do SFU. Criado sob demanda porque só a moderação de voz usa —
 * o resto do app fala com o LiveKit por token, não por API.
 */
let sfu: RoomServiceClient | null = null;

function roomService() {
  // o endpoint HTTP é o mesmo do WebSocket, trocando o esquema
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

/**
 * Quanto tempo a chamada sobrevive à queda da conexão dona. Existe por causa do
 * reload: a aba reconecta em ~2s, e tirar a pessoa da chamada nesse intervalo é
 * exatamente o que o Discord NÃO faz.
 *
 * 6s cobre um reload com folga sem deixar "fantasma" na lista quando alguém
 * fecha a aba de vez — 12s era tempo demais olhando pra uma pessoa que já saiu.
 * Sair pelo botão continua sendo instantâneo: ali o cliente avisa antes.
 */
export const VOICE_GRACE_MS = 6_000;

/**
 * Estado de voz vive só no Redis: é efêmero (muda a cada clique em mutar) e
 * precisa sumir sozinho se o processo cair. No banco viraria "fantasma" eterno
 * na lista do canal.
 */
export const voiceService = {
  /**
   * Silenciar/ensurdecer pelo servidor. Não basta mandar o cliente se mutar —
   * cliente é do outro lado e pode ignorar. O corte real acontece no SFU
   * (`mutePublishedTrack`), e o estado fica gravado pra valer também se a
   * pessoa reconectar.
   */
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

  /** Corta a track publicada no próprio SFU. */
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

  /** Tira a pessoa da sala de mídia. Usado por "desconectar" e por "mover". */
  async desconectarDoSfu(channelId: string, userId: string) {
    await roomService()
      .removeParticipant(roomName(channelId), userId)
      .catch(() => undefined);
  },

  /**
   * O token do LiveKit É a permissão. O SFU não conhece nossos servidores nem
   * nossos membros: ele confia neste JWT, que só é emitido depois de a API
   * confirmar que a pessoa é membro do servidor daquele canal.
   */
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
      // Curto de propósito: só precisa durar até a conexão ser estabelecida.
      ttl: "10m",
    });

    token.addGrant({
      room: roomName(channelId),
      roomJoin: true,
      /**
       * Publicar exige SPEAK. Quem não tem entra e ouve — é o "só leitura" da
       * voz, e quem decide isso é o token, não a interface.
       */
      canPublish:
        !contexto ||
        (has(contexto.permissions, "SPEAK") &&
          !estaDeCastigo(contexto.member) &&
          !(anterior?.channelId === channelId && anterior.serverMute)),
      canSubscribe: true,
      canPublishData: true,
    });

    /**
     * `USE_VAD` é o único caso aqui que o servidor NÃO consegue impor sozinho:
     * o SFU não sabe se o áudio veio de detecção de voz ou de tecla apertada.
     * Vai como instrução para o cliente, e a interface trava o modo.
     *
     * Quem adulterar o cliente escapa — por isso é uma ferramenta contra
     * microfone barulhento, não contra quem age de má-fé. Para esse caso existe
     * `MUTE_MEMBERS`, que corta no próprio SFU.
     */
    const exigePushToTalk = Boolean(contexto) && !has(contexto!.permissions, "USE_VAD");

    return { url: env.LIVEKIT_URL, token: await token.toJwt(), exigePushToTalk };
  },

  async join(userId: string, channelId: string, socketId: string, resume = false) {
    const { channel } = await accessService.requireChannelAccess(userId, channelId);
    if (channel.type !== "VOICE") throw new AppError("Este canal não é de voz");
    if (!channel.guildId) throw new AppError("Canal de voz inválido");

    const previous = await voiceService.get(userId);

    /**
     * Limite de pessoas do canal. Quem já está dentro (reload, troca de aba)
     * não conta de novo — senão o último a recarregar ficaria de fora da
     * própria chamada.
     */
    if (channel.userLimit > 0 && previous?.channelId !== channelId) {
      const dentro = await redis.scard(keys.voiceChannel(channelId));
      if (dentro >= channel.userLimit) throw new AppError("Este canal de voz está cheio", 403);
    }

    /**
     * Retomada só vale se a chamada estiver órfã. Se outra aba está ao vivo
     * nela, entrar aqui derrubaria a sessão de mídia dela no meio da conversa —
     * o servidor decide isso agora, no pedido, e não o cliente por um flag que
     * pode ter chegado atrasado.
     */
    if (resume && previous && previous.channelId === channelId && !previous.orphanedAt) {
      throw new AppError("Outra aba está nesta chamada");
    }
    // Trocar de canal é sair do anterior primeiro — ninguém fica em dois.
    const left = previous && previous.channelId !== channelId ? await voiceService.leave(userId) : null;

    // Preserva só as preferências; câmera e tela começam desligadas na sala nova.
    const state: VoiceState = {
      userId,
      channelId,
      guildId: channel.guildId,
      socketId,
      ...DEFAULTS,
      /**
       * Reload ou troca de aba no MESMO canal continua a mesma participação —
       * senão o cronômetro da chamada voltaria a zero toda vez que alguém
       * recarregasse a página.
       */
      joinedAt: previous?.channelId === channelId ? previous.joinedAt : Date.now(),
      selfMute: previous?.selfMute ?? DEFAULTS.selfMute,
      selfDeaf: previous?.selfDeaf ?? DEFAULTS.selfDeaf,
      /**
       * Mudo de servidor gruda na pessoa: sair e voltar não desfaz, senão
       * bastaria reconectar pra escapar da moderação.
       */
      serverMute: previous?.serverMute ?? false,
      serverDeaf: previous?.serverDeaf ?? false,
      // reassumiu: não está mais órfão
      orphanedAt: null,
    };

    await redis
      .multi()
      .set(keys.voiceState(userId), JSON.stringify(state))
      .sadd(keys.voiceChannel(channelId), userId)
      .exec();

    return { state, left };
  },

  /**
   * `onlyIfSocket` protege o caso de várias abas: se a aba que caiu não era a
   * que estava na chamada, o estado da conta não pode ser apagado — senão
   * fechar uma aba qualquer tira você da call em que está falando.
   */
  /**
   * A conexão dona caiu. Marca como órfão em vez de apagar — quem chama agenda
   * a remoção definitiva. Se for outra conexão que caiu, não mexe em nada.
   */
  async orphan(userId: string, socketId: string): Promise<VoiceState | null> {
    const state = await voiceService.get(userId);
    if (!state || state.socketId !== socketId || state.orphanedAt) return null;

    const orphaned = { ...state, orphanedAt: Date.now() };
    await redis.set(keys.voiceState(userId), JSON.stringify(orphaned));
    return orphaned;
  },

  /**
   * Passada a janela: se ninguém reassumiu, encerra de verdade. Compara o
   * socketId pra não apagar uma chamada nova que a pessoa acabou de iniciar.
   */
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

  /** Quem está em cada canal de voz — usado ao abrir o servidor. */
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

    /**
     * O `channelId` do estado manda, não o conjunto em que a pessoa aparece.
     *
     * São duas chaves separadas no Redis — o conjunto do canal e o estado da
     * pessoa — e elas podem divergir: uma saída que não chegou a limpar o
     * conjunto (processo morto no meio, `SREM` perdido) deixa o usuário
     * listado num canal que ele já não está. O sintoma é a mesma pessoa
     * aparecendo em DOIS canais de voz ao mesmo tempo, o que não pode existir.
     */
    return Object.fromEntries(
      channelIds.map((channelId, i) => [
        channelId,
        (memberships[i] ?? [])
          .map((u) => byUser.get(u))
          .filter((s): s is VoiceState => Boolean(s) && s!.channelId === channelId),
      ]),
    );
  },

  /** Na subida do servidor: limpa estado herdado de um processo anterior. */
  async reset() {
    const stale = await redis.keys("voice:*");
    if (stale.length) await redis.del(...stale);
  },
};

/**
 * Completa campos que estados antigos do Redis não têm.
 *
 * O estado de voz é gravado como JSON puro, sem migração: uma chamada que já
 * estava em andamento quando o servidor subiu com um campo novo continua no
 * formato velho até a pessoa sair e voltar. Sem isto, `joinedAt` chegava
 * `undefined` na tela e o cronômetro virava `NaN:NaN`.
 */
function hidratar(state: VoiceState): VoiceState {
  return { ...state, joinedAt: state.joinedAt ?? Date.now() };
}


