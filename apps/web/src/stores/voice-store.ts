import { create } from "zustand";
import {
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
  type Participant,
  type TrackPublication,
  type LocalAudioTrack,
} from "livekit-client";
import { findVoiceToken } from "~/@core/application/requests/voice/find-voice-token";
import { proximoAlvo } from "~/lib/assistir";
import { descreverFonte } from "~/lib/fonte-da-tela";
import { ProcessadorDeVoz } from "~/lib/audio-gate";
import { desktop } from "~/lib/desktop";
import { tocarSom, type SomDaInterface } from "~/lib/ui-sounds";
import { ajustesDe, useVoicePrefs, type VoicePrefs } from "~/stores/voice-prefs";
import { apiErrorMessage } from "~/@core/lib/api";
import {
  joinVoiceChannel,
  leaveVoiceChannel,
  updateVoiceState,
} from "~/@core/lib/websocket/emit-voice";

export type VoiceTile = {
  identity: string;
  name: string;
  avatarUrl: string | null;
  isLocal: boolean;
  speaking: boolean;
  micEnabled: boolean;
  cameraTrack: Track | null;
  screenTrack: Track | null;
  /*
    Voz e som da tela vivem em campos separados de propósito.

    Num campo só, o `VoiceAudioSink` tocava os dois sempre que a pessoa estava
    na sala — e era exatamente isso que fazia o som da live continuar tocando
    pra quem NÃO estava assistindo. Separados, cada um tem seu destino: a voz
    toca sempre, o som da tela só pra quem abriu a transmissão.
  */
  micTrack: Track | null;
  screenAudioTrack: Track | null;
  /// medida do LiveKit: "excellent" | "good" | "poor" | "lost" | "unknown"
  qualidade: string;
};

type VoiceStore = {
  room: Room | null;
  channelId: string | null;
  connecting: boolean;
  error: string | null;

  micEnabled: boolean;
  micBlocked: boolean;
  processador: ProcessadorDeVoz | null;
  noiseFilterAvailable: boolean;
  noiseFilterBusy: boolean;
  deafened: boolean;
  cameraEnabled: boolean;
  screenEnabled: boolean;

  tiles: VoiceTile[];
  assistindo: string | null;
  exigePushToTalk: boolean;
  guildId: string | null;
  palcoVisivel: boolean;
  volumesLocais: Record<string, number>;
  silenciadosLocais: Record<string, boolean>;
  volumesDeTela: Record<string, number>;
  /*
    O que você está transmitindo — "Tela 1", "Visual Studio Code", o nome do
    jogo — com o ícone do app quando existe.

    No desktop o dado é bom: o `desktopCapturer` do Electron já devolve nome e
    ícone de cada fonte, e o seletor guarda o que foi escolhido. No navegador
    não há seletor nosso, e sobra o rótulo da faixa, que costuma ser um id
    ("screen:0:0") em vez de um nome — daí o campo aceitar não ter ícone e o
    nome cair num genérico.
  */
  fonteDaTela: { nome: string; icone: string | null } | null;

  join: (channelId: string, options?: { resume?: boolean }) => Promise<void>;
  leave: () => Promise<void>;
  toggleMic: () => Promise<void>;
  toggleDeafen: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleScreen: () => Promise<void>;
  toggleNoiseFilter: () => Promise<void>;
  assistir: (identity: string | null) => void;
  definirPalcoVisivel: (visivel: boolean) => void;
  setVolumeLocal: (userId: string, volume: number) => void;
  setVolumeDeTela: (userId: string, volume: number) => void;
  definirFonteDaTela: (fonte: { nome: string; icone: string | null } | null) => void;
  toggleSilenciarLocal: (userId: string) => void;
  aplicarAjustes: (mudanca: Partial<VoicePrefs>) => Promise<void>;
  definirPtt: (pressionado: boolean) => void;
  observarNivel: (ouvinte: (nivel: number, aberto: boolean) => void) => () => void;
  reset: () => void;
};

function avatarDoParticipante(metadata: string | undefined): string | null {
  if (!metadata) return null;

  try {
    return (JSON.parse(metadata) as { avatarUrl?: string | null }).avatarUrl ?? null;
  } catch {
    return null;
  }
}

function snapshot(room: Room): VoiceTile[] {
  const build = (p: Participant, isLocal: boolean): VoiceTile => {
    const track = (source: Track.Source) => {
      const pub = p.getTrackPublication(source) as TrackPublication | undefined;
      return pub?.track ?? null;
    };

    /// Ninguém ouve o próprio áudio de volta — daí o local não publicar nada aqui.
    const ouvivel = (source: Track.Source) => (isLocal ? null : track(source));

    return {
      identity: p.identity,
      name: p.name || p.identity,
      avatarUrl: avatarDoParticipante(p.metadata),
      isLocal,
      speaking: p.isSpeaking,
      micEnabled: p.isMicrophoneEnabled,
      cameraTrack: track(Track.Source.Camera),
      screenTrack: track(Track.Source.ScreenShare),
      micTrack: ouvivel(Track.Source.Microphone),
      screenAudioTrack: ouvivel(Track.Source.ScreenShareAudio),
      qualidade: p.connectionQuality,
    };
  };

  return [
    build(room.localParticipant, true),
    ...[...room.remoteParticipants.values()].map((p: RemoteParticipant) => build(p, false)),
  ];
}

const TAB_VOICE_KEY = "gravae:voice-channel";
const TAB_ID_KEY = "gravae:voice-cliente";

/*
  Identidade desta ABA, estável entre recargas.

  Fica no `sessionStorage` porque é exatamente a semântica que queremos: ele
  sobrevive ao F5 e ao restart do app, mas cada aba nova nasce com o seu. É com
  isso que o servidor distingue "voltei de uma recarga" de "abri numa segunda
  aba" — o `socketId` não serve, porque muda nas duas situações.
*/
export const clienteDestaAba = (): string | undefined => {
  try {
    const salvo = sessionStorage.getItem(TAB_ID_KEY);
    if (salvo) return salvo;

    const novo = crypto.randomUUID();
    sessionStorage.setItem(TAB_ID_KEY, novo);
    return novo;
  } catch {
    /// Sem sessionStorage (aba anônima travada, storage cheio) volta o
    /// comportamento antigo: sem identidade, o servidor decide pelo órfão.
    return undefined;
  }
};

/*
  O volume de cada pessoa mora no navegador.

  Era estado de memória: bastava recarregar o app — ou o processo do desktop
  reiniciar — para o bot de música voltar a gritar no volume padrão. Como é
  uma decisão sobre ALGUÉM ("esse aí é alto demais"), ela vale para as
  próximas chamadas também, não só para esta.
*/
const AJUSTES_KEY = "gravae:volumes-por-pessoa";

interface AjustesPorPessoa {
  volumes: Record<string, number>;
  silenciados: Record<string, boolean>;
  /*
    O volume da TRANSMISSÃO de alguém, separado do volume da voz.

    São duas queixas diferentes e merecem dois controles: "a voz dele está
    baixa" não é "o jogo que ele está transmitindo está estourando". Antes o
    ajuste era um só e mexia nos dois — abaixar o barulho da live emudecia a
    pessoa junto.
  */
  telas: Record<string, number>;
}

function lerAjustesPorPessoa(): AjustesPorPessoa {
  try {
    const salvo = localStorage.getItem(AJUSTES_KEY);
    if (!salvo) return { volumes: {}, silenciados: {}, telas: {} };

    const dados = JSON.parse(salvo) as Partial<AjustesPorPessoa>;
    /// `telas` nasceu depois: quem já tem ajustes salvos não o tem, e o `??`
    /// é o que evita `undefined` chegando na leitura de volume.
    return { volumes: dados.volumes ?? {}, silenciados: dados.silenciados ?? {}, telas: dados.telas ?? {} };
  } catch {
    return { volumes: {}, silenciados: {}, telas: {} };
  }
}

function guardarAjustesPorPessoa(ajustes: AjustesPorPessoa) {
  try {
    localStorage.setItem(AJUSTES_KEY, JSON.stringify(ajustes));
  } catch {
  }
}

const apontaProLocalhost = (url: string) => /\/\/(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
const estamosNoLocalhost = () =>
  ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

export const rememberVoiceTab = (channelId: string | null) => {
  try {
    if (channelId) sessionStorage.setItem(TAB_VOICE_KEY, channelId);
    else sessionStorage.removeItem(TAB_VOICE_KEY);
  } catch {
  }
};

export const voiceTabChannelId = (): string | null => {
  try {
    return sessionStorage.getItem(TAB_VOICE_KEY);
  } catch {
    return null;
  }
};

const CAPTURA_LIMPA = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
} as const;

function opcoesDeCaptura() {
  const { entradaId } = useVoicePrefs.getState();

  return {
    ...CAPTURA_LIMPA,
    ...(entradaId ? { deviceId: { exact: entradaId } } : {}),
  };
}

const permissaoDoSistema = (): Promise<boolean> =>
  desktop()?.midia.garantir("microphone") ?? Promise.resolve(true);

async function prenderProcessador(room: Room, processador: ProcessadorDeVoz) {
  const publicacao = room.localParticipant.getTrackPublication(Track.Source.Microphone);
  const track = publicacao?.track as LocalAudioTrack | undefined;

  if (!track || track.getProcessor()) return;
  await track.setProcessor(processador);
}

function disponibilidade(processador: ProcessadorDeVoz): boolean {
  return useVoicePrefs.getState().supressaoDeRuido
    ? processador.supressaoAtiva
    : processador.supressaoDisponivel;
}

function bipe(nome: SomDaInterface) {
  const { somDaInterface, volumeSaida } = useVoicePrefs.getState();
  tocarSom(nome, { mudo: !somDaInterface || store_().deafened, volume: volumeSaida });
}

let store_: () => VoiceStore;

export const useVoiceStore = create<VoiceStore>((set, store) => {
  store_ = store;

  return {
  room: null,
  channelId: null,
  connecting: false,
  error: null,
  micEnabled: true,
  micBlocked: false,
  processador: null,
  noiseFilterAvailable: true,
  noiseFilterBusy: false,
  deafened: false,
  cameraEnabled: false,
  screenEnabled: false,
  tiles: [],
  assistindo: null,
  exigePushToTalk: false,
  guildId: null,
  palcoVisivel: false,
  volumesLocais: lerAjustesPorPessoa().volumes,
  silenciadosLocais: lerAjustesPorPessoa().silenciados,
  volumesDeTela: lerAjustesPorPessoa().telas,
  fonteDaTela: null,

  join: async (channelId, options) => {
    if (store().channelId === channelId) return;
    await store().leave();

    set({ connecting: true, error: null, channelId });

    try {
      const { url, token, exigePushToTalk } = await findVoiceToken(channelId);

      if (apontaProLocalhost(url) && !estamosNoLocalhost()) {
        throw new Error(
          "A voz não está disponível neste acesso: o servidor de voz roda só na máquina de quem hospeda. " +
            "O texto, os anexos e o resto do chat funcionam normalmente.",
        );
      }

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      const refresh = () => {
        /*
          O volume NÃO é mais aplicado por participante aqui.

          `p.setVolume()` age no participante inteiro — voz e som de tela juntos
          —, e agora esses dois têm destinos diferentes: a voz toca sempre, a
          tela só pra quem assiste, cada uma com seu próprio ajuste. Quem manda
          no volume é o elemento `<audio>` em `VoiceTrack.tsx`, que já reaplica
          o valor a cada mudança. Manter as duas vias fazia o LiveKit sobrescrever
          o ajuste por faixa toda vez que qualquer coisa na sala mudasse.
        */
        const tiles = snapshot(room);

        const eu = tiles.find((t) => t.isLocal);
        const camera = Boolean(eu?.cameraTrack);
        const tela = Boolean(eu?.screenTrack);
        const { cameraEnabled, screenEnabled, assistindo } = store();

        const proximoAssistindo = proximoAlvo({
          atual: assistindo,
          alvoAindaTransmite: tiles.some((t) => t.identity === assistindo && t.screenTrack),
        });

        if (proximoAssistindo !== assistindo) set({ assistindo: proximoAssistindo });

        set({ tiles, cameraEnabled: camera, screenEnabled: tela });

        if (camera !== cameraEnabled || tela !== screenEnabled) {
          void updateVoiceState({
            ...(camera !== cameraEnabled ? { camera } : {}),
            ...(tela !== screenEnabled ? { screenShare: tela } : {}),
          }).catch(() => undefined);

          if (tela !== screenEnabled) bipe(tela ? "liveNoAr" : "liveEncerrada");
        }
      };

      room
        .on(RoomEvent.ParticipantConnected, () => {
          bipe("alguemEntrou");
          refresh();
        })
        .on(RoomEvent.ParticipantDisconnected, () => {
          bipe("alguemSaiu");
          refresh();
        })
        .on(RoomEvent.TrackSubscribed, refresh)
        .on(RoomEvent.TrackUnsubscribed, refresh)
        .on(RoomEvent.TrackPublished, refresh)
        .on(RoomEvent.TrackUnpublished, refresh)
        .on(RoomEvent.LocalTrackPublished, refresh)
        .on(RoomEvent.LocalTrackUnpublished, refresh)
        /// sem isto o selo de conexao so mudaria quando outra coisa mexesse
        /// na sala — alguem entrando, mutando, publicando faixa
        .on(RoomEvent.ConnectionQualityChanged, refresh)
        .on(RoomEvent.TrackMuted, refresh)
        .on(RoomEvent.TrackUnmuted, refresh)
        .on(RoomEvent.ActiveSpeakersChanged, refresh)
        .on(RoomEvent.Disconnected, () => {
          set({ room: null, channelId: null, guildId: null, tiles: [], assistindo: null, cameraEnabled: false, screenEnabled: false });
        });

      await room.connect(url, token);

      set({ exigePushToTalk: Boolean(exigePushToTalk) });

      const prefs = useVoicePrefs.getState();
      const ajustes = ajustesDe(prefs);

      const processador = new ProcessadorDeVoz(
        exigePushToTalk ? { ...ajustes, modo: "ptt" } : ajustes,
      );
      set({ processador });

      try {
        await permissaoDoSistema();
        await room.localParticipant.setMicrophoneEnabled(
          !store().deafened && store().micEnabled,
          opcoesDeCaptura(),
        );

        await prenderProcessador(room, processador);
        set({ micBlocked: false, noiseFilterAvailable: disponibilidade(processador) });
        bipe("entrarNaChamada");
      } catch (erro) {
        console.warn("[voz] não deu pra publicar o microfone:", erro);
        set({ micEnabled: false, micBlocked: true });
      }

      if (prefs.saidaId) {
        await room.switchActiveDevice("audiooutput", prefs.saidaId).catch(() => undefined);
      }

      set({ room, connecting: false, tiles: snapshot(room) });
      rememberVoiceTab(channelId);

      const estado = (await joinVoiceChannel(
        channelId,
        options?.resume ?? false,
        clienteDestaAba(),
      )) as
        | { guildId?: string }
        | undefined;

      if (estado?.guildId) set({ guildId: estado.guildId });
      await updateVoiceState({ selfMute: !store().micEnabled, selfDeaf: store().deafened });
    } catch (err) {
      set({ connecting: false, channelId: null, error: apiErrorMessage(err, "Não deu pra entrar na chamada") });
      throw err;
    }
  },

  leave: async () => {
    const { room } = store();
    if (!room) return;

    rememberVoiceTab(null);

    bipe("sairDaChamada");
    await room.disconnect();
    set({ room: null, channelId: null, guildId: null, tiles: [], assistindo: null, cameraEnabled: false, screenEnabled: false, processador: null });
    await leaveVoiceChannel().catch(() => undefined);
  },

  toggleMic: async () => {
    const { room, micEnabled, deafened } = store();
    const next = !micEnabled;

    set({ micEnabled: next });
    if (next && deafened) await store().toggleDeafen();

    try {
      await permissaoDoSistema();
      await room?.localParticipant.setMicrophoneEnabled(next, opcoesDeCaptura());

      const { processador } = store();
      if (room && processador) await prenderProcessador(room, processador);
      set({ micBlocked: false });
      bipe(next ? "desmutar" : "mutar");
    } catch {
      set({ micEnabled: false, micBlocked: true });
      return;
    }

    await updateVoiceState({ selfMute: !next }).catch(() => undefined);
  },

  toggleDeafen: async () => {
    const { room, deafened } = store();
    const next = !deafened;

    if (next) bipe("ensurdecer");
    set({ deafened: next });
    if (!next) bipe("desensurdecer");
    if (next) {
      set({ micEnabled: false });
      await room?.localParticipant.setMicrophoneEnabled(false);
    }

    await updateVoiceState({ selfDeaf: next, selfMute: next ? true : undefined }).catch(() => undefined);
  },

  toggleCamera: async () => {
    const { room, cameraEnabled } = store();
    if (!room) return;

    const next = !cameraEnabled;
    await room.localParticipant.setCameraEnabled(next);
    set({ cameraEnabled: next, tiles: snapshot(room) });
    await updateVoiceState({ camera: next }).catch(() => undefined);
  },

  reset: () => {
    rememberVoiceTab(null);
    void store().room?.disconnect();
    set({ room: null, channelId: null, guildId: null, tiles: [], assistindo: null, cameraEnabled: false, screenEnabled: false, processador: null });
  },

  assistir: (identity) => set({ assistindo: identity }),
  definirPalcoVisivel: (visivel) => set({ palcoVisivel: visivel }),
  definirFonteDaTela: (fonte) => set({ fonteDaTela: fonte }),

  toggleNoiseFilter: async () => {
    const { supressaoDeRuido } = useVoicePrefs.getState();
    await store().aplicarAjustes({ supressaoDeRuido: !supressaoDeRuido });
  },

  aplicarAjustes: async (mudanca) => {
    const { definir } = useVoicePrefs.getState();
    definir(mudanca);

    const { room, processador } = store();
    const prefs = useVoicePrefs.getState();

    const trocouSupressao = mudanca.supressaoDeRuido !== undefined && !!processador;

    if (trocouSupressao) set({ noiseFilterBusy: true });

    try {
      const ajustes = ajustesDe(prefs);
      await processador?.aplicar(
        store().exigePushToTalk ? { ...ajustes, modo: "ptt" } : ajustes,
      );
    } finally {
      if (trocouSupressao && processador) {
        set({ noiseFilterBusy: false, noiseFilterAvailable: disponibilidade(processador) });
      }
    }

    if (!room) return;

    if (mudanca.entradaId !== undefined) {
      await room.switchActiveDevice("audioinput", mudanca.entradaId ?? "default").catch(() => undefined);
    }

    if (mudanca.saidaId !== undefined) {
      await room.switchActiveDevice("audiooutput", mudanca.saidaId ?? "default").catch(() => undefined);
    }
  },

  definirPtt: (pressionado) => store().processador?.definirPtt(pressionado),

  /*
    O volume vive no ESTADO, e só nele.

    Não há mais nenhum `participante.setVolume()` por aqui. Ele agia no
    participante inteiro — voz e som de tela na mesma tecla —, e o som da tela
    agora tem destino próprio. Quem aplica é o elemento `<audio>` de
    `VoiceTrack.tsx`, que reage a `volumeSaida`, `volumesLocais`,
    `silenciadosLocais` e `deafened`. Mudar aqui basta pra chegar lá.
  */
  setVolumeLocal: (userId, volume) => {
    const volumes = { ...store().volumesLocais, [userId]: volume };
    set({ volumesLocais: volumes });
    guardarAjustesPorPessoa({ volumes, silenciados: store().silenciadosLocais, telas: store().volumesDeTela });
  },

  setVolumeDeTela: (userId, volume) => {
    const telas = { ...store().volumesDeTela, [userId]: volume };
    set({ volumesDeTela: telas });
    guardarAjustesPorPessoa({
      volumes: store().volumesLocais,
      silenciados: store().silenciadosLocais,
      telas,
    });
  },

  toggleSilenciarLocal: (userId) => {
    const mudo = !store().silenciadosLocais[userId];
    const silenciados = { ...store().silenciadosLocais, [userId]: mudo };
    set({ silenciadosLocais: silenciados });
    guardarAjustesPorPessoa({ volumes: store().volumesLocais, silenciados, telas: store().volumesDeTela });
  },

  observarNivel: (ouvinte) => store().processador?.observarNivel(ouvinte) ?? (() => undefined),

  toggleScreen: async () => {
    const { room, screenEnabled } = store();
    if (!room) return;

    const next = !screenEnabled;

    /// Encerrar limpa a fonte antes de tudo: se o `set` viesse só no fim, o
    /// painel continuaria anunciando "Tela 1" durante a despublicação.
    if (!next) set({ fonteDaTela: null });

    try {
      const { somDaTela } = useVoicePrefs.getState();
      await room.localParticipant.setScreenShareEnabled(next, { audio: somDaTela });
      const tiles = snapshot(room);

      set({
        screenEnabled: next,
        tiles,
        fonteDaTela: next
          ? descreverFonte(store().fonteDaTela, tiles.find((t) => t.isLocal)?.screenTrack?.mediaStreamTrack)
          : null,
      });
      bipe(next ? "liveNoAr" : "liveEncerrada");
      await updateVoiceState({ screenShare: next }).catch(() => undefined);
    } catch {
      set({ screenEnabled: false, fonteDaTela: null });
    }
  },
  };
});
