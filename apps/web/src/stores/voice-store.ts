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
  audioTracks: Track[];
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

    const audioTracks = isLocal
      ? []
      : ([track(Track.Source.Microphone), track(Track.Source.ScreenShareAudio)].filter(Boolean) as Track[]);

    return {
      identity: p.identity,
      name: p.name || p.identity,
      avatarUrl: avatarDoParticipante(p.metadata),
      isLocal,
      speaking: p.isSpeaking,
      micEnabled: p.isMicrophoneEnabled,
      cameraTrack: track(Track.Source.Camera),
      screenTrack: track(Track.Source.ScreenShare),
      audioTracks,
    };
  };

  return [
    build(room.localParticipant, true),
    ...[...room.remoteParticipants.values()].map((p: RemoteParticipant) => build(p, false)),
  ];
}

const TAB_VOICE_KEY = "gravae:voice-channel";

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
}

function lerAjustesPorPessoa(): AjustesPorPessoa {
  try {
    const salvo = localStorage.getItem(AJUSTES_KEY);
    if (!salvo) return { volumes: {}, silenciados: {} };

    const dados = JSON.parse(salvo) as Partial<AjustesPorPessoa>;
    return { volumes: dados.volumes ?? {}, silenciados: dados.silenciados ?? {} };
  } catch {
    return { volumes: {}, silenciados: {} };
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
        const { volumeSaida } = useVoicePrefs.getState();
        const { deafened, volumesLocais, silenciadosLocais } = store();

        room.remoteParticipants.forEach((p) => {
          const individual = volumesLocais[p.identity] ?? 1;
          const mudo = deafened || silenciadosLocais[p.identity];

          p.setVolume(mudo ? 0 : volumeSaida * individual);
        });

        const tiles = snapshot(room);

        const eu = tiles.find((t) => t.isLocal);
        const camera = Boolean(eu?.cameraTrack);
        const tela = Boolean(eu?.screenTrack);
        const { cameraEnabled, screenEnabled, assistindo } = store();

        const aindaTransmite = tiles.some((t) => t.identity === assistindo && t.screenTrack);
        const proximoAssistindo = tela && eu ? eu.identity : aindaTransmite ? assistindo : null;

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

      const estado = (await joinVoiceChannel(channelId, options?.resume ?? false)) as
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

    const { volumeSaida } = useVoicePrefs.getState();
    room?.remoteParticipants.forEach((p) => p.setVolume(next ? 0 : volumeSaida));
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

    if (mudanca.volumeSaida !== undefined) {
      const volume = store().deafened ? 0 : mudanca.volumeSaida;
      room.remoteParticipants.forEach((p) => p.setVolume(volume));
    }
  },

  definirPtt: (pressionado) => store().processador?.definirPtt(pressionado),

  setVolumeLocal: (userId, volume) => {
    const volumes = { ...store().volumesLocais, [userId]: volume };
    set({ volumesLocais: volumes });
    guardarAjustesPorPessoa({ volumes, silenciados: store().silenciadosLocais });

    const participante = store().room?.remoteParticipants.get(userId);
    participante?.setVolume(store().silenciadosLocais[userId] ? 0 : volume);
  },

  toggleSilenciarLocal: (userId) => {
    const mudo = !store().silenciadosLocais[userId];
    const silenciados = { ...store().silenciadosLocais, [userId]: mudo };
    set({ silenciadosLocais: silenciados });
    guardarAjustesPorPessoa({ volumes: store().volumesLocais, silenciados });

    const participante = store().room?.remoteParticipants.get(userId);
    participante?.setVolume(mudo ? 0 : (store().volumesLocais[userId] ?? 1));
  },

  observarNivel: (ouvinte) => store().processador?.observarNivel(ouvinte) ?? (() => undefined),

  toggleScreen: async () => {
    const { room, screenEnabled } = store();
    if (!room) return;

    const next = !screenEnabled;

    try {
      const { somDaTela } = useVoicePrefs.getState();
      await room.localParticipant.setScreenShareEnabled(next, { audio: somDaTela });
      set({ screenEnabled: next, tiles: snapshot(room) });
      bipe(next ? "liveNoAr" : "liveEncerrada");
      await updateVoiceState({ screenShare: next }).catch(() => undefined);
    } catch {
      set({ screenEnabled: false });
    }
  },
  };
});
