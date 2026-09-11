import { create } from "zustand";

import { DEFAULT_SETTINGS, type VoiceSettings, type EntryMode } from "~/features/voz/lib/audio-gate";

export interface VoicePrefs extends VoiceSettings {
  entryId: string | null;
  outputId: string | null;
  cameraId: string | null;
  mirrorCamera: boolean;
  showWithoutVideo: boolean;
  volumeOutput: number;
  keyPtt: string;
  interfaceSound: boolean;
  screenSound: boolean;
  panelSound: boolean;
  panelVolume: number;
}

const DEFAULT: VoicePrefs = {
  ...DEFAULT_SETTINGS,
  entryId: null,
  outputId: null,
  cameraId: null,
  mirrorCamera: true,
  showWithoutVideo: true,
  volumeOutput: 1,
  keyPtt: "Space",
  interfaceSound: true,
  screenSound: true,
  panelSound: true,
  panelVolume: 1,
};

const KEY = "gravae:voice-prefs";

function read(): VoicePrefs {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? { ...DEFAULT, ...(JSON.parse(saved) as Partial<VoicePrefs>) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

interface VoicePrefsStore extends VoicePrefs {
  set: (change: Partial<VoicePrefs>) => void;
  defaultRestore: () => void;
}

export const useVoicePrefs = create<VoicePrefsStore>((set, store) => ({
  ...read(),

  set: (change) => {
    set(change);

    try {
      const { set, defaultRestore, ...prefs } = store();
      void set;
      void defaultRestore;
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
    }
  },

  defaultRestore: () => store().set(DEFAULT),
}));

export const settingsFor = (prefs: VoicePrefs): VoiceSettings => ({
  gainEntry: prefs.gainEntry,
  mode: prefs.mode,
  sensitivityAutomatic: prefs.sensitivityAutomatic,
  threshold: prefs.threshold,
  noiseSuppression: prefs.noiseSuppression,
});

export type { EntryMode };
