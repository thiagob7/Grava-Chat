import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import type { VoiceState } from "@gravae/shared";
import { has, rooms } from "@gravae/shared";
import { env } from "~/env.js";
import { AppError, ForbiddenError } from "~/lib/http.js";
import { ehOutraAba } from "~/lib/retomada.js";
import { redis, keys } from "~/lib/redis.js";
import { userRepository } from "~/repositories/user-repository.js";
import { channelRepository, guildRepository } from "~/repositories/guild-repository.js";
import { accessService } from "./access-service.js";

export const roomName = (channelId: string) => `channel-${channelId}`;
const canalDaSala = (nomeDaSala: string) => nomeDaSala.replace(/^channel-/, "");

/// O Mongo estoura na consulta se o id não tiver a forma de ObjectId, e o
/// LiveKit aceita qualquer string como identidade. Filtrar antes é o que
/// impede um participante estranho de derrubar o painel inteiro.
const ehObjectId = (valor: string) => /^[0-9a-f]{24}$/i.test(valor);

/*
  Um canal de privado serve de sala de chamada.

  `guildId` nulo é o que define um DM no schema (`Channel.guildId`), e o tipo
  dele é TEXT porque a conversa nasceu como conversa. Ligar não cria canal
  nenhum: a sala do LiveKit é derivada do id do canal, igual em servidor.
*/
const ehChamadaDePrivado = (channel: { guildId: string | null }) => channel.guildId === null;

/**
 * Quem precisa saber do estado de voz desta pessoa.
 *
 * Em servidor é a sala da guild, e pronto. No privado não existe essa sala —
 * então falamos com as duas pessoas da conversa pelas salas de usuário delas,
 * que o gateway assina na conexão. É o que faz a ligação TOCAR para quem está
 * com o app aberto noutra tela: a sala do canal só teria quem já abriu a
 * conversa, e quem está sendo chamado normalmente não está lá.
 */
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

/*
  Sobrevida da chave orfã no Redis.

  O `setTimeout` que colhe o órfão vive DENTRO do processo. Se a API reinicia
  na janela — deploy, crash, `yarn dev` recarregando — o temporizador morre e a
  chave fica no Redis pra sempre: a pessoa aparece na chamada, desligada,
  indefinidamente. O TTL é a rede embaixo do trapézio.
*/
const TTL_DO_ORFAO_MS = 60_000;

/*
  Quanto esperamos antes de confiar na ausência de alguém no SFU.

  Entre pedir pra entrar e o navegador de fato conectar no LiveKit passam
  segundos. Varrer sem essa carência derrubaria justamente quem está entrando.
*/
const CARENCIA_DO_SFU_MS = 25_000;

export const voiceService = {
  /*
    Radiografia do SFU pro painel: que salas estão abertas e QUEM está dentro.

    Pergunta ao próprio LiveKit, não ao Redis, de propósito — o Redis guarda o
    que a NOSSA aplicação acha que está acontecendo, e a graça do painel é
    justamente pegar divergência entre os dois.

    `listRooms` sozinho devolve `channel-<id>` e um número. Nome de sala não é
    nome de canal e número não é gente: sem trocar os ids por canal, servidor e
    pessoa, o painel mostra um hash e uma contagem, que é exatamente o que não
    ajuda a entender uma chamada travada às onze da noite.
  */
  async estadoDoSfu() {
    const [salas, chaves] = await Promise.all([
      roomService().listRooms(),
      /// Mesmo `keys` que a varredura de fantasmas usa. Varre o keyspace
      /// inteiro, mas ele cabe na palma da mão aqui — e é a única forma de
      /// achar estado preso num canal que nem sala tem mais.
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

    /*
      Fantasma: o app jura que a pessoa está em chamada e o SFU não a vê.

      Uso a MESMA carência da varredura que limpa isso sozinha — quem acabou de
      clicar em entrar ainda não conectou no LiveKit e não é fantasma nenhum.
      Passada a carência, fantasma na tela é sinal de que a varredura parou de
      rodar, que é exatamente o que ninguém descobre sem olhar.
    */
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

    /*
      De que servidor é a sala, segundo o Redis.

      Serve para a sala cujo canal foi apagado com a chamada ainda viva: o
      documento do canal não existe mais, mas o estado de voz de quem está
      dentro ainda carrega o `guildId`. Sem isso o painel só saberia dizer
      "canal sumiu" e ficaria por aí.
    */
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

    /*
      Junto de quem está na sala vêm os donos das conversas privadas: canal de
      DM se chama "dm" no banco, então o nome útil na tela é o das duas pessoas
      — e uma delas pode estar sendo chamada sem ter atendido, isto é, sem
      aparecer entre os participantes do SFU.
    */
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

      /// Canal de DM se chama "dm" no banco; o nome útil é o das duas pessoas.
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

      /*
        Sala sem canal no banco tem duas causas bem diferentes, e chamar as
        duas de "canal sumiu" manda investigar o problema errado.

        Se ninguém lá dentro existe neste banco, a sala não é nossa: é o
        `LIVEKIT_URL` apontando pro SFU de outro ambiente — o `.env` de
        desenvolvimento faz exatamente isso, mira o SFU de produção. Se as
        pessoas SÃO daqui e só o canal não é, aí sim o canal foi apagado com a
        chamada viva dentro.
      */
      const alguemDaqui = pessoas.some((p) => usuarioPorId.has(p.identity));
      const motivo: "canal-apagado" | "outro-ambiente" | null = canal
        ? null
        : pessoas.length > 0 && !alguemDaqui
          ? "outro-ambiente"
          : "canal-apagado";

      return {
        canalId,
        /// `null` quando não dá pra saber: a tela diz o que houve em vez de
        /// mostrar o id cru como se fosse nome de canal.
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
            /*
              Três estados, não dois: sem trilha é microfone que nunca foi
              publicado (ouvinte, ou conexão que ficou pelo caminho), e mudo é
              trilha publicada e silenciada. Juntar os dois num booleano
              esconde justamente o caso em que a chamada está quebrada.
            */
            microfone: microfone ? (microfone.muted ? "mudo" : "aberto") : "sem",
            camera: Boolean(camera && !camera.muted),
            tela: Boolean(tela && !tela.muted),
            entrouEm: Number(p.joinedAt),
            /// Está no SFU e o Redis não sabe: zumbi. A varredura expulsa
            /// depois da carência — se continua aqui, ela não está rodando.
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
        /// Mesmo critério das salas: sem canal no banco a tela diz o que
        /// houve, em vez de imprimir o id como se fosse nome.
        canal: canalPorId.has(e.channelId) ? nomeDoCanal(e.channelId) : null,
        desde: Math.round(e.joinedAt / 1000),
        /// Já tinha caído e está na janela de reconexão: some sozinho, provável.
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

    /*
      No privado a chamada acontece no PRÓPRIO canal da conversa, que é do tipo
      TEXT — não existe um canal de voz separado pra criar, e criar um só pra
      ligar seria um documento a mais pra manter vivo e limpar depois.

      O acesso já foi checado: `requireChannelAccess` devolve `contexto` nulo
      justamente para DM, e só depois de confirmar que quem pede está entre os
      `recipients`. Quem não é dos dois nem chega aqui.
    */
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
    /// Com prazo: se o processo cair antes de colher, o Redis colhe por ele.
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

  /*
    Confere o que o Redis acha com o que o LiveKit sabe, nos DOIS sentidos.

    As duas fontes erram de jeitos diferentes, e cada uma engana uma parte da
    tela: a lista embaixo do canal vem do Redis, e os quadros do palco vêm do
    `room.remoteParticipants` do LiveKit. Um fantasma pode estar em qualquer
    uma — ou nas duas.

    REDIS SEM SFU acontece quando o cliente some sem se despedir e o órfão não
    é colhido. Sai do Redis.

    SFU SEM REDIS é o zumbi: a conexão do cliente morreu de um jeito que o
    LiveKit não percebeu (máquina dormiu, rede caiu sem fechar o socket), e ele
    segue listando a pessoa na sala. Aqui o Redis está CERTO e o SFU errado —
    a pessoa fica com quadro no palco pra sempre. Esse é expulso do SFU.

    Devolve os estados removidos do Redis pra quem chamou anunciar a saída; os
    expulsos do SFU não precisam de anúncio, porque o próprio LiveKit avisa os
    clientes quando alguém deixa a sala.
  */
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

    /// `channel-<id>` é o nome que damos à sala; só nos interessam as nossas.
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

    /// Redis sem SFU: o estado é fantasma, some do Redis.
    const orfaos = noRedis.filter(
      (e) => agora - e.joinedAt > CARENCIA_DO_SFU_MS && !noSfu.has(`${e.channelId}:${e.userId}`),
    );

    const doRedis = (await Promise.all(orfaos.map((e) => voiceService.leave(e.userId)))).filter(
      (e): e is VoiceState => Boolean(e),
    );

    /*
      SFU sem Redis: o participante é zumbi, sai da sala.

      A trava: só mexemos numa sala onde este Redis reconhece ALGUÉM. É o que
      prova que a sala é deste ambiente.

      Sem ela isto vira uma arma. O `.env` de desenvolvimento aponta o
      `LIVEKIT_URL` para o SFU de PRODUÇÃO — então a API rodando na máquina de
      alguém enxerga as salas de produção, não reconhece nenhum daqueles
      usuários no seu Redis local, e expulsaria todo mundo de todas as chamadas
      ao vivo. Com a trava, uma sala em que este Redis não conhece ninguém é
      simplesmente ignorada.
    */
    const conhecidos = new Set(noRedis.map((e) => `${e.channelId}:${e.userId}`));

    const zumbis = participantes.flatMap(({ channelId, sala, lista }) => {
      const nossa = lista.some((p) => conhecidos.has(`${channelId}:${p.identity}`));
      if (!nossa) return [];

      return lista
        .filter((p) => {
          if (conhecidos.has(`${channelId}:${p.identity}`)) return false;
          /// `joinedAt` do LiveKit vem em segundos; quem acabou de entrar ainda
          /// pode não ter estado no Redis, e não é zumbi.
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

