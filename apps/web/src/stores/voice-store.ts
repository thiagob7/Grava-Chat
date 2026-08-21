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
  /** microfone + audio da tela; vazio no participante local (nao se ouve) */
  audioTracks: Track[];
};

type VoiceStore = {
  room: Room | null;
  channelId: string | null;
  connecting: boolean;
  error: string | null;

  micEnabled: boolean;
  /** microfone negado/ausente: entra na call só pra ouvir */
  micBlocked: boolean;
  /** dono da cadeia de áudio da sua voz — ver lib/audio-gate.ts */
  processador: ProcessadorDeVoz | null;
  /** false quando o navegador ou o plano não suportam o filtro avançado */
  noiseFilterAvailable: boolean;
  /** true enquanto o filtro está sendo aplicado na track */
  noiseFilterBusy: boolean;
  deafened: boolean;
  cameraEnabled: boolean;
  screenEnabled: boolean;

  tiles: VoiceTile[];
  /** volume por pessoa, só pra você (0..2) */
  volumesLocais: Record<string, number>;
  /** quem você silenciou só pra você */
  silenciadosLocais: Record<string, boolean>;

  join: (channelId: string, options?: { resume?: boolean }) => Promise<void>;
  leave: () => Promise<void>;
  toggleMic: () => Promise<void>;
  toggleDeafen: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleScreen: () => Promise<void>;
  toggleNoiseFilter: () => Promise<void>;
  setVolumeLocal: (userId: string, volume: number) => void;
  toggleSilenciarLocal: (userId: string) => void;
  /**
   * Muda uma preferência de áudio e aplica na chamada em andamento, se houver.
   * Ponto único: a tela de configurações não fala com o LiveKit direto.
   */
  aplicarAjustes: (mudanca: Partial<VoicePrefs>) => Promise<void>;
  /** Tecla do push-to-talk pressionada ou solta. */
  definirPtt: (pressionado: boolean) => void;
  /** Medidor ao vivo da sua voz durante a chamada. */
  observarNivel: (ouvinte: (nivel: number, aberto: boolean) => void) => () => void;
  /** Desliga tudo — usado no logout. */
  reset: () => void;
};

/**
 * A foto vem no metadata que a API assina junto com o token (ver
 * voice-service.ts). O LiveKit não conhece nossos usuários — é por aqui que o
 * avatar chega ao palco sem uma consulta extra por participante.
 */
function avatarDoParticipante(metadata: string | undefined): string | null {
  if (!metadata) return null;

  try {
    return (JSON.parse(metadata) as { avatarUrl?: string | null }).avatarUrl ?? null;
  } catch {
    return null;
  }
}

/** Monta a lista de participantes a partir do estado atual da sala. */
function snapshot(room: Room): VoiceTile[] {
  const build = (p: Participant, isLocal: boolean): VoiceTile => {
    const track = (source: Track.Source) => {
      const pub = p.getTrackPublication(source) as TrackPublication | undefined;
      return pub?.track ?? null;
    };

    /**
     * Com o livekit-client puro, o audio remoto NAO toca sozinho: e preciso
     * anexar cada track a um elemento no DOM. Sem isso a chamada conecta,
     * mostra todo mundo, e fica muda.
     */
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

/**
 * Marca de "esta aba estava numa chamada", em sessionStorage.
 *
 * sessionStorage é a ferramenta certa aqui: sobrevive ao reload MAS é isolado
 * por aba. Com localStorage, fechar a aba da chamada faria outra aba aberta
 * reassumir a call sozinha — que é justamente o que ninguém quer.
 */
const TAB_VOICE_KEY = "gravae:voice-channel";

const apontaProLocalhost = (url: string) => /\/\/(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
const estamosNoLocalhost = () =>
  ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

export const rememberVoiceTab = (channelId: string | null) => {
  try {
    if (channelId) sessionStorage.setItem(TAB_VOICE_KEY, channelId);
    else sessionStorage.removeItem(TAB_VOICE_KEY);
  } catch {
    /* modo privado sem storage: só perde o reconectar automático */
  }
};

export const voiceTabChannelId = (): string | null => {
  try {
    return sessionStorage.getItem(TAB_VOICE_KEY);
  } catch {
    return null;
  }
};

/**
 * Processamento de áudio da captura.
 *
 * Duas camadas: o navegador já faz cancelamento de eco, controle de ganho e uma
 * supressão de ruído básica — isso é grátis e sempre liga. Por cima, o Krisp
 * (mesmo filtro que o Discord usa) roda como processador na track local e
 * remove ruído de fundo de verdade: ventilador, teclado, obra na rua.
 */
const CAPTURA_LIMPA = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
} as const;

/** Opções da captura: dispositivo escolhido nas configurações + limpeza nativa. */
function opcoesDeCaptura() {
  const { entradaId } = useVoicePrefs.getState();

  return {
    ...CAPTURA_LIMPA,
    ...(entradaId ? { deviceId: { exact: entradaId } } : {}),
  };
}

/**
 * No aplicativo, a permissão do macOS vem ANTES da do Chromium — e é uma coisa
 * separada dela. Sem isto o `getUserMedia` falha calado e a tela acusa o
 * navegador por uma caixinha desmarcada nos Ajustes do Sistema.
 *
 * No navegador não existe essa camada: devolve `true` e segue.
 */
const permissaoDoSistema = (): Promise<boolean> =>
  desktop()?.midia.garantir("microphone") ?? Promise.resolve(true);

/**
 * Prende o processador na track do microfone que já está publicada.
 *
 * Tem que ser DEPOIS de publicar, e não junto com a captura: o LiveKit só
 * entrega o AudioContext à track no momento em que ela é publicada, e um
 * processador criado antes disso morre com "Audio context needs to be set" —
 * o que na tela virava um "microfone bloqueado" que não tinha nada a ver com
 * permissão.
 */
async function prenderProcessador(room: Room, processador: ProcessadorDeVoz) {
  const publicacao = room.localParticipant.getTrackPublication(Track.Source.Microphone);
  const track = publicacao?.track as LocalAudioTrack | undefined;

  if (!track || track.getProcessor()) return;
  await track.setProcessor(processador);
}

/**
 * Bipe da interface, respeitando as duas razões pra ficar calado: a pessoa
 * desligou os bipes, ou está surda (quem não quer ouvir ninguém também não quer
 * ouvir bipe). Fica aqui, e não em cada ação, pra essa regra existir num lugar
 * só.
 */
function bipe(nome: SomDaInterface) {
  const { somDaInterface, volumeSaida } = useVoicePrefs.getState();
  tocarSom(nome, { mudo: !somDaInterface || store_().deafened, volume: volumeSaida });
}

/** Referência tardia à store: `bipe` é definido antes de ela existir. */
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
  volumesLocais: {},
  silenciadosLocais: {},

  join: async (channelId, options) => {
    if (store().channelId === channelId) return;
    await store().leave();

    set({ connecting: true, error: null, channelId });

    try {
      // O token é a permissão: a API só o emite depois de confirmar que você é
      // membro do servidor daquele canal.
      const { url, token } = await findVoiceToken(channelId);

      /**
       * O servidor de voz aponta pra localhost, mas esta página está sendo
       * acessada de fora (ngrok, IP da rede). "localhost" no navegador de quem
       * acessa é a máquina DELE, onde não existe SFU — a tentativa morreria com
       * ERR_CONNECTION_REFUSED e uma sequência de retentativas sem sentido.
       *
       * O SFU precisa de endereço público e de UDP; um túnel HTTP não carrega
       * isso. A saída é apontar LIVEKIT_URL pra um SFU alcançável.
       */
      if (apontaProLocalhost(url) && !estamosNoLocalhost()) {
        throw new Error(
          "A voz não está disponível neste acesso: o servidor de voz roda só na máquina de quem hospeda. " +
            "O texto, os anexos e o resto do chat funcionam normalmente.",
        );
      }

      const room = new Room({
        adaptiveStream: true,
        // Simulcast: quem tem banda ruim recebe uma resolução menor em vez de
        // travar a chamada inteira.
        dynacast: true,
      });

      const refresh = () => {
        /**
         * O volume vale pra quem entrar DEPOIS também — por isso aqui, e não só
         * no momento em que a pessoa mexe no controle.
         */
        const { volumeSaida } = useVoicePrefs.getState();
        const { deafened, volumesLocais, silenciadosLocais } = store();

        room.remoteParticipants.forEach((p) => {
          // o ajuste individual manda sobre o volume geral
          const individual = volumesLocais[p.identity] ?? 1;
          const mudo = deafened || silenciadosLocais[p.identity];

          p.setVolume(mudo ? 0 : volumeSaida * individual);
        });

        set({ tiles: snapshot(room) });
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
          set({ room: null, channelId: null, tiles: [], cameraEnabled: false, screenEnabled: false });
        });

      await room.connect(url, token);

      /**
       * Microfone negado ou inexistente não pode derrubar a entrada: dá pra
       * participar só ouvindo. Antes, um "não permitir" no navegador fazia a
       * chamada inteira falhar com uma mensagem de erro sem sentido.
       */
      const prefs = useVoicePrefs.getState();
      const processador = new ProcessadorDeVoz(ajustesDe(prefs));
      set({ processador });

      try {
        await permissaoDoSistema();
        await room.localParticipant.setMicrophoneEnabled(
          !store().deafened && store().micEnabled,
          opcoesDeCaptura(),
        );

        await prenderProcessador(room, processador);
        set({ micBlocked: false, noiseFilterAvailable: processador.supressaoDisponivel });
        bipe("entrarNaChamada");

        // mesma regra da troca: se o filtro não subiu ao entrar, a preferência
        // acompanha a realidade em vez de deixar o botão aceso à toa
        if (prefs.supressaoDeRuido && !processador.supressaoAtiva) {
          useVoicePrefs.getState().definir({ supressaoDeRuido: false });
        }
      } catch (erro) {
        // fica no console porque "microfone bloqueado" tem várias causas
        // (permissão negada, dispositivo sumiu, processador falhando) e a
        // mensagem na tela não pode listar todas
        console.warn("[voz] não deu pra publicar o microfone:", erro);
        set({ micEnabled: false, micBlocked: true });
      }

      // alto-falante escolhido nas configurações; o LiveKit aplica setSinkId
      // nos elementos que já estão tocando
      if (prefs.saidaId) {
        await room.switchActiveDevice("audiooutput", prefs.saidaId).catch(() => undefined);
      }

      set({ room, connecting: false, tiles: snapshot(room) });
      rememberVoiceTab(channelId);

      // Avisa o resto do app (barra lateral, lista de membros) por WebSocket —
      // o LiveKit só cuida da mídia, não da nossa noção de "quem está onde".
      /**
       * Se o servidor recusar a retomada (outra aba está ao vivo na chamada),
       * desfaz a conexão de mídia — ficar conectado no SFU sem o servidor
       * reconhecer deixaria duas abas disputando o mesmo áudio.
       */
      await joinVoiceChannel(channelId, options?.resume ?? false);
      await updateVoiceState({ selfMute: !store().micEnabled, selfDeaf: store().deafened });
    } catch (err) {
      set({ connecting: false, channelId: null, error: apiErrorMessage(err, "Não deu pra entrar na chamada") });
      throw err;
    }
  },

  leave: async () => {
    const { room } = store();
    if (!room) return;

    // antes do disconnect: depois dele o `deafened` que o bipe consulta já era
    bipe("sairDaChamada");
    await room.disconnect();
    set({ room: null, channelId: null, tiles: [], cameraEnabled: false, screenEnabled: false, processador: null });
    // Saída deliberada: não reconecta no próximo reload.
    rememberVoiceTab(null);
    await leaveVoiceChannel().catch(() => undefined);
  },

  toggleMic: async () => {
    const { room, micEnabled, deafened } = store();
    const next = !micEnabled;

    set({ micEnabled: next });
    // Sair do surdo ao falar é o comportamento esperado: se você desmutou, é
    // porque quer participar.
    if (next && deafened) await store().toggleDeafen();

    try {
      await permissaoDoSistema();
      await room?.localParticipant.setMicrophoneEnabled(next, opcoesDeCaptura());

      // desmutar pode ter recriado a track; o processador precisa voltar nela
      const { processador } = store();
      if (room && processador) await prenderProcessador(room, processador);
      set({ micBlocked: false });
      // só depois de dar certo: bipar antes mentiria quando a permissão nega
      bipe(next ? "desmutar" : "mutar");
    } catch {
      // permissão negada agora: volta ao estado mudo em vez de mentir na UI
      set({ micEnabled: false, micBlocked: true });
      return;
    }

    await updateVoiceState({ selfMute: !next }).catch(() => undefined);
  },

  toggleDeafen: async () => {
    const { room, deafened } = store();
    const next = !deafened;

    /**
     * A ordem importa: o `bipe` fica calado quando você está surdo. Ficando
     * surdo, ele toca ANTES de o estado virar; saindo, DEPOIS. Nos dois casos
     * você ouve a confirmação — que é justamente a informação que falta quando
     * o mundo emudece.
     */
    if (next) bipe("ensurdecer");
    set({ deafened: next });
    if (!next) bipe("desensurdecer");
    // Ficar surdo também muta: ninguém fica ouvindo você sem você ouvir ninguém.
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
    set({ room: null, channelId: null, tiles: [], cameraEnabled: false, screenEnabled: false, processador: null });
  },

  /** Atalho do painel de voz para o mesmo ajuste que vive nas configurações. */
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

    // o Krisp leva um instante pra ligar (na primeira vez, baixa o modelo); o
    // botão mostra isso em vez de parecer que não fez nada
    if (trocouSupressao) set({ noiseFilterBusy: true });

    try {
      await processador?.aplicar(ajustesDe(prefs));
    } finally {
      if (trocouSupressao && processador) {
        /**
         * A preferência não pode mentir. Se o filtro não subiu, o botão volta
         * sozinho pro estado real — antes ele ficava aceso com o Krisp
         * desligado, e a pessoa só descobria ao sair e entrar da chamada.
         */
        if (processador.supressaoAtiva !== useVoicePrefs.getState().supressaoDeRuido) {
          definir({ supressaoDeRuido: processador.supressaoAtiva });
        }

        set({ noiseFilterBusy: false, noiseFilterAvailable: processador.supressaoDisponivel });
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

  /**
   * Volume e mudo por pessoa valem só pra você — nada disso vai pro servidor.
   * O LiveKit aplica direto no participante remoto, então o efeito é imediato.
   */
  setVolumeLocal: (userId, volume) => {
    set({ volumesLocais: { ...store().volumesLocais, [userId]: volume } });

    const participante = store().room?.remoteParticipants.get(userId);
    participante?.setVolume(store().silenciadosLocais[userId] ? 0 : volume);
  },

  toggleSilenciarLocal: (userId) => {
    const mudo = !store().silenciadosLocais[userId];
    set({ silenciadosLocais: { ...store().silenciadosLocais, [userId]: mudo } });

    const participante = store().room?.remoteParticipants.get(userId);
    participante?.setVolume(mudo ? 0 : (store().volumesLocais[userId] ?? 1));
  },

  observarNivel: (ouvinte) => store().processador?.observarNivel(ouvinte) ?? (() => undefined),

  toggleScreen: async () => {
    const { room, screenEnabled } = store();
    if (!room) return;

    const next = !screenEnabled;

    try {
      // audio: true captura o som da aba/tela junto — é o que faz assistir
      // vídeo em conjunto funcionar de verdade.
      await room.localParticipant.setScreenShareEnabled(next, { audio: true });
      set({ screenEnabled: next, tiles: snapshot(room) });
      bipe(next ? "liveNoAr" : "liveEncerrada");
      await updateVoiceState({ screenShare: next }).catch(() => undefined);
    } catch {
      // O usuário cancelou o seletor de tela do navegador — não é erro.
      set({ screenEnabled: false });
    }
  },
  };
});
