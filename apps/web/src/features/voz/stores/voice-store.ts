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
import { nextTarget } from "~/features/voz/lib/assistir";
import {
  microphoneReactionFailure,
  type MicrophoneReactionFailure,
} from "~/features/voz/lib/falha-de-microfone";
import { describeFont } from "~/lib/fonte-da-tela";
import { VoiceProcessor } from "~/features/voz/lib/audio-gate";
import { desktop } from "~/lib/desktop";
import { stopPanelSound } from "~/features/voz/lib/soundboard";
import { playSound, type InterfaceSound } from "~/lib/ui-sounds";
import { settingsFor, useVoicePrefs, type VoicePrefs } from "~/features/voz/stores/voice-prefs";
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
  micTrack: Track | null;
  screenAudioTrack: Track | null;
  quality: string;
};

type VoiceStore = {
  room: Room | null;
  channelId: string | null;
  connecting: boolean;
  error: string | null;

  micEnabled: boolean;
  micBlocked: boolean;
  reconnecting: boolean;
  processor: VoiceProcessor | null;
  noiseFilterAvailable: boolean;
  noiseFilterBusy: boolean;
  deafened: boolean;
  cameraEnabled: boolean;
  screenEnabled: boolean;

  tiles: VoiceTile[];
  watching: string | null;
  requiresPushToTalk: boolean;
  guildId: string | null;
  visibleStage: boolean;
  volumesLocal: Record<string, number>;
  mutedLocal: Record<string, boolean>;
  screenVolumes: Record<string, number>;
  screenFont: { name: string; icon: string | null } | null;

  join: (channelId: string, options?: { resume?: boolean }) => Promise<void>;
  leave: () => Promise<void>;
  toggleMic: () => Promise<void>;
  toggleDeafen: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleScreen: () => Promise<void>;
  toggleNoiseFilter: () => Promise<void>;
  watch: (identity: string | null) => void;
  setStageVisible: (visible: boolean) => void;
  callChat: boolean;
  toggleCallChat: () => void;
  setVolumeLocal: (userId: string, volume: number) => void;
  setScreenVolume: (userId: string, volume: number) => void;
  setScreenFont: (font: { name: string; icon: string | null } | null) => void;
  toggleMuteLocal: (userId: string) => void;
  applySettings: (change: Partial<VoicePrefs>) => Promise<void>;
  setPtt: (pressed: boolean) => void;
  observeLevel: (listener: (level: number, isOpen: boolean) => void) => () => void;
  reset: () => void;
};

function participantAvatar(metadata: string | undefined): string | null {
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

    const audible = (source: Track.Source) => (isLocal ? null : track(source));

    return {
      identity: p.identity,
      name: p.name || p.identity,
      avatarUrl: participantAvatar(p.metadata),
      isLocal,
      speaking: p.isSpeaking,
      micEnabled: p.isMicrophoneEnabled,
      cameraTrack: track(Track.Source.Camera),
      screenTrack: track(Track.Source.ScreenShare),
      micTrack: audible(Track.Source.Microphone),
      screenAudioTrack: audible(Track.Source.ScreenShareAudio),
      quality: p.connectionQuality,
    };
  };

  return [
    build(room.localParticipant, true),
    ...[...room.remoteParticipants.values()].map((p: RemoteParticipant) => build(p, false)),
  ];
}

const TAB_VOICE_KEY = "gravae:voice-channel";
const TAB_ID_KEY = "gravae:voice-cliente";

export const clientThisTab = (): string | undefined => {
  try {
    const saved = sessionStorage.getItem(TAB_ID_KEY);
    if (saved) return saved;

    const fresh = crypto.randomUUID();
    sessionStorage.setItem(TAB_ID_KEY, fresh);
    return fresh;
  } catch {
    return undefined;
  }
};

const SETTINGS_KEY = "gravae:volumes-por-pessoa";

interface SettingsByPerson {
  volumes: Record<string, number>;
  mutedIds: Record<string, boolean>;
  screens: Record<string, number>;
}

function readSettingsByPerson(): SettingsByPerson {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return { volumes: {}, mutedIds: {}, screens: {} };

    const data = JSON.parse(saved) as Partial<SettingsByPerson>;
    return { volumes: data.volumes ?? {}, mutedIds: data.mutedIds ?? {}, screens: data.screens ?? {} };
  } catch {
    return { volumes: {}, mutedIds: {}, screens: {} };
  }
}

function storeSettingsByPerson(settings: SettingsByPerson) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
  }
}

const pointsProLocalhost = (url: string) => /\/\/(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
const areLocalhost = () =>
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

const CAPTURE_CLEAN = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
} as const;

function captureOptions() {
  const { entryId } = useVoicePrefs.getState();

  return {
    ...CAPTURE_CLEAN,
    ...(entryId ? { deviceId: { exact: entryId } } : {}),
  };
}

const systemPermission = (): Promise<boolean> =>
  desktop()?.media.ensure("microphone") ?? Promise.resolve(true);

function applyMicrophoneFailure(
  error: unknown,
  set: (partial: Partial<VoiceStore>) => void,
  store: () => VoiceStore,
): MicrophoneReactionFailure {
  const reaction = microphoneReactionFailure(error, { reconnecting: store().reconnecting });

  if (reaction === "estourar") {
    console.error("[voz] falha de microfone que é bug nosso:", error);
    set({ micEnabled: false, micBlocked: true });
    return reaction;
  }

  if (reaction === "mutar") {
    console.warn("[voz] não deu pra publicar o microfone:", error);
    set({ micEnabled: false, micBlocked: true });
    return reaction;
  }

  if (reaction === "adiar") {
    console.info("[voz] microfone falhou por algo passageiro; tentando de novo depois:", error);
    set({ micBlocked: false });
  }

  return reaction;
}

async function reapplyMicrophone(
  room: Room,
  set: (partial: Partial<VoiceStore>) => void,
  store: () => VoiceStore,
) {
  const { micEnabled, deafened, processor } = store();

  try {
    await room.localParticipant.setMicrophoneEnabled(
      micEnabled && !deafened,
      captureOptions(),
    );

    if (processor) await holdProcessor(room, processor);
    set({ micBlocked: false });
  } catch (error) {
    applyMicrophoneFailure(error, set, store);
  }
}

async function holdProcessor(room: Room, processor: VoiceProcessor) {
  const post = room.localParticipant.getTrackPublication(Track.Source.Microphone);
  const track = post?.track as LocalAudioTrack | undefined;

  if (!track || track.getProcessor()) return;
  await track.setProcessor(processor);
}

function availability(processor: VoiceProcessor): boolean {
  return useVoicePrefs.getState().noiseSuppression
    ? processor.activeSuppression
    : processor.availableSuppression;
}

function beep(name: InterfaceSound) {
  const { interfaceSound, volumeOutput } = useVoicePrefs.getState();
  playSound(name, { isMuted: !interfaceSound || store_().deafened, volume: volumeOutput });
}

let store_: () => VoiceStore;

const notifyServer = (patch: Parameters<typeof updateVoiceState>[0]) => {
  if (!store_().channelId) return Promise.resolve(null);

  return updateVoiceState(patch).catch(() => null);
};

export const useVoiceStore = create<VoiceStore>((set, store) => {
  store_ = store;

  return {
  room: null,
  channelId: null,
  connecting: false,
  error: null,
  micEnabled: true,
  micBlocked: false,
  reconnecting: false,
  processor: null,
  noiseFilterAvailable: true,
  noiseFilterBusy: false,
  deafened: false,
  callChat: true,
  cameraEnabled: false,
  screenEnabled: false,
  tiles: [],
  watching: null,
  requiresPushToTalk: false,
  guildId: null,
  visibleStage: false,
  volumesLocal: readSettingsByPerson().volumes,
  mutedLocal: readSettingsByPerson().mutedIds,
  screenVolumes: readSettingsByPerson().screens,
  screenFont: null,

  join: async (channelId, options) => {
    if (store().channelId === channelId) return;
    await store().leave();

    set({ connecting: true, error: null, channelId });

    try {
      const { url, token, requiresPushToTalk } = await findVoiceToken(channelId);

      if (pointsProLocalhost(url) && !areLocalhost()) {
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
        const tiles = snapshot(room);

        const eu = tiles.find((t) => t.isLocal);
        const camera = Boolean(eu?.cameraTrack);
        const display = Boolean(eu?.screenTrack);
        const { cameraEnabled, screenEnabled, watching } = store();

        const nextWatching = nextTarget({
          current: watching,
          targetStillBroadcasts: tiles.some((t) => t.identity === watching && t.screenTrack),
        });

        if (nextWatching !== watching) set({ watching: nextWatching });

        set({ tiles, cameraEnabled: camera, screenEnabled: display });

        if (camera !== cameraEnabled || display !== screenEnabled) {
          void notifyServer({
            ...(camera !== cameraEnabled ? { camera } : {}),
            ...(display !== screenEnabled ? { screenShare: display } : {}),
          });

          if (display !== screenEnabled) beep(display ? "liveNoAr" : "liveEnded");
        }
      };

      room
        .on(RoomEvent.ParticipantConnected, () => {
          beep("someoneJoined");
          refresh();
        })
        .on(RoomEvent.ParticipantDisconnected, () => {
          beep("someoneLeft");
          refresh();
        })
        .on(RoomEvent.TrackSubscribed, refresh)
        .on(RoomEvent.TrackUnsubscribed, refresh)
        .on(RoomEvent.TrackPublished, refresh)
        .on(RoomEvent.TrackUnpublished, refresh)
        .on(RoomEvent.LocalTrackPublished, refresh)
        .on(RoomEvent.LocalTrackUnpublished, refresh)
        .on(RoomEvent.ConnectionQualityChanged, refresh)
        .on(RoomEvent.TrackMuted, refresh)
        .on(RoomEvent.TrackUnmuted, refresh)
        .on(RoomEvent.ActiveSpeakersChanged, refresh)
        .on(RoomEvent.Reconnecting, () => set({ reconnecting: true }))
        .on(RoomEvent.Reconnected, () => {
          set({ reconnecting: false });
          void reapplyMicrophone(room, set, store);
        })
        .on(RoomEvent.Disconnected, () => {
          set({ room: null, channelId: null, guildId: null, tiles: [], watching: null, cameraEnabled: false, screenEnabled: false, reconnecting: false });
        });

      await room.connect(url, token);

      set({ requiresPushToTalk: Boolean(requiresPushToTalk) });

      const prefs = useVoicePrefs.getState();
      const settings = settingsFor(prefs);

      const processor = new VoiceProcessor(
        requiresPushToTalk ? { ...settings, mode: "ptt" } : settings,
      );
      set({ processor });

      try {
        await systemPermission();
        await room.localParticipant.setMicrophoneEnabled(
          !store().deafened && store().micEnabled,
          captureOptions(),
        );

        await holdProcessor(room, processor);
        set({ micBlocked: false, noiseFilterAvailable: availability(processor) });
        beep("joinCall");
      } catch (error) {
        if (applyMicrophoneFailure(error, set, store) === "adiar" && !store().reconnecting) {
          set({ micEnabled: false, micBlocked: true });
        }
      }

      if (prefs.outputId) {
        await room.switchActiveDevice("audiooutput", prefs.outputId).catch(() => undefined);
      }

      set({ room, connecting: false, tiles: snapshot(room) });
      rememberVoiceTab(channelId);

      const state = (await joinVoiceChannel(
        channelId,
        options?.resume ?? false,
        clientThisTab(),
      )) as
        | { guildId?: string }
        | undefined;

      if (state?.guildId) set({ guildId: state.guildId });
      await notifyServer({ selfMute: !store().micEnabled, selfDeaf: store().deafened });
    } catch (err) {
      set({ connecting: false, channelId: null, error: apiErrorMessage(err, "Não deu pra entrar na chamada") });
      throw err;
    }
  },

  leave: async () => {
    const { room } = store();
    if (!room) return;

    rememberVoiceTab(null);

    beep("leaveCall");
    stopPanelSound();
    set({ callChat: true });
    await room.disconnect();
    set({ room: null, channelId: null, guildId: null, tiles: [], watching: null, cameraEnabled: false, screenEnabled: false, processor: null });
    await leaveVoiceChannel().catch(() => undefined);
  },

  toggleMic: async () => {
    const { room, micEnabled, deafened } = store();
    const next = !micEnabled;

    set({ micEnabled: next });
    if (next && deafened) await store().toggleDeafen();

    try {
      await systemPermission();
      await room?.localParticipant.setMicrophoneEnabled(next, captureOptions());

      const { processor } = store();
      if (room && processor) await holdProcessor(room, processor);
      set({ micBlocked: false });
      beep(next ? "unmute" : "mute");
    } catch (error) {
      if (applyMicrophoneFailure(error, set, store) === "adiar" && !store().reconnecting) {
        set({ micEnabled: !next });
      }
      return;
    }

    await notifyServer({ selfMute: !next });
  },

  toggleDeafen: async () => {
    const { room, deafened } = store();
    const next = !deafened;

    if (next) beep("deafen");
    if (next) stopPanelSound();
    set({ deafened: next });
    if (!next) beep("undeafen");
    if (next) {
      set({ micEnabled: false });
      await room?.localParticipant.setMicrophoneEnabled(false);
    }

    await notifyServer({ selfDeaf: next, selfMute: next ? true : undefined });
  },

  toggleCamera: async () => {
    const { room, cameraEnabled } = store();
    if (!room) return;

    const next = !cameraEnabled;
    const { cameraId } = useVoicePrefs.getState();
    await room.localParticipant.setCameraEnabled(
      next,
      cameraId ? { deviceId: { exact: cameraId } } : undefined,
    );
    set({ cameraEnabled: next, tiles: snapshot(room) });
    await notifyServer({ camera: next });
  },

  reset: () => {
    rememberVoiceTab(null);
    void store().room?.disconnect();
    set({ room: null, channelId: null, guildId: null, tiles: [], watching: null, cameraEnabled: false, screenEnabled: false, processor: null });
  },

  watch: (identity) => set({ watching: identity }),
  toggleCallChat: () => set({ callChat: !store().callChat }),

  setStageVisible: (visible) => set({ visibleStage: visible }),
  setScreenFont: (font) => set({ screenFont: font }),

  toggleNoiseFilter: async () => {
    const { noiseSuppression } = useVoicePrefs.getState();
    await store().applySettings({ noiseSuppression: !noiseSuppression });
  },

  applySettings: async (change) => {
    useVoicePrefs.getState().set(change);

    const { room, processor } = store();
    const prefs = useVoicePrefs.getState();

    const swappedSuppression = change.noiseSuppression !== undefined && !!processor;

    if (swappedSuppression) set({ noiseFilterBusy: true });

    try {
      const settings = settingsFor(prefs);
      await processor?.apply(
        store().requiresPushToTalk ? { ...settings, mode: "ptt" } : settings,
      );
    } finally {
      if (swappedSuppression && processor) {
        set({ noiseFilterBusy: false, noiseFilterAvailable: availability(processor) });
      }
    }

    if (!room) return;

    if (change.entryId !== undefined) {
      await room.switchActiveDevice("audioinput", change.entryId ?? "default").catch(() => undefined);
    }

    if (change.outputId !== undefined) {
      await room.switchActiveDevice("audiooutput", change.outputId ?? "default").catch(() => undefined);
    }
  },

  setPtt: (pressed) => store().processor?.setPtt(pressed),

  setVolumeLocal: (userId, volume) => {
    const volumes = { ...store().volumesLocal, [userId]: volume };
    set({ volumesLocal: volumes });
    storeSettingsByPerson({ volumes, mutedIds: store().mutedLocal, screens: store().screenVolumes });
  },

  setScreenVolume: (userId, volume) => {
    const screens = { ...store().screenVolumes, [userId]: volume };
    set({ screenVolumes: screens });
    storeSettingsByPerson({
      volumes: store().volumesLocal,
      mutedIds: store().mutedLocal,
      screens,
    });
  },

  toggleMuteLocal: (userId) => {
    const isMuted = !store().mutedLocal[userId];
    const mutedIds = { ...store().mutedLocal, [userId]: isMuted };
    set({ mutedLocal: mutedIds });
    storeSettingsByPerson({ volumes: store().volumesLocal, mutedIds, screens: store().screenVolumes });
  },

  observeLevel: (listener) => store().processor?.observeLevel(listener) ?? (() => undefined),

  toggleScreen: async () => {
    const { room, screenEnabled } = store();
    if (!room) return;

    const next = !screenEnabled;

    if (!next) set({ screenFont: null });

    try {
      const { screenSound } = useVoicePrefs.getState();
      await room.localParticipant.setScreenShareEnabled(next, { audio: screenSound });
      const tiles = snapshot(room);

      set({
        screenEnabled: next,
        tiles,
        screenFont: next
          ? describeFont(store().screenFont, tiles.find((t) => t.isLocal)?.screenTrack?.mediaStreamTrack)
          : null,
      });
      beep(next ? "liveNoAr" : "liveEnded");
      await notifyServer({ screenShare: next });
    } catch {
      set({ screenEnabled: false, screenFont: null });
    }
  },
  };
});
