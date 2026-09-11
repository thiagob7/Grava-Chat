import { create } from "zustand";

export type ChannelMode = "tudo" | "mencoes" | "nada";

export interface ServerPrefs {
  mode: ChannelMode | null;
  mutedUntil: number | null;
  hideMuted: boolean;
  everyone?: boolean;
  roleList?: boolean;
}

export interface NoticePrefs {
  notice: boolean;
  soMentions: boolean;
  sound: boolean;
  counter: boolean;
  byChannel: Record<string, ChannelMode>;
  byServer: Record<string, ServerPrefs>;
  soundsOff: Record<string, boolean>;
}

const DEFAULT: NoticePrefs = {
  notice: true,
  soMentions: false,
  sound: true,
  counter: true,
  byChannel: {},
  byServer: {},
  soundsOff: {},
};

const KEY = "gravae:avisos";

function read(): NoticePrefs {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? { ...DEFAULT, ...(JSON.parse(saved) as Partial<NoticePrefs>) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

interface NoticesStore extends NoticePrefs {
  set: (change: Partial<NoticePrefs>) => void;
  setChannel: (channelId: string, mode: ChannelMode | null) => void;
  setServer: (guildId: string, change: Partial<ServerPrefs>) => void;
  setSound: (name: string, on: boolean) => void;
}

export const useNotices = create<NoticesStore>((set, store) => ({
  ...read(),

  set: (change) => {
    set(change);

    try {
      const { set, setChannel, setServer, setSound, ...prefs } = store();
      void set;
      void setChannel;
      void setServer;
      void setSound;
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
    }
  },

  setSound: (name, on) => {
    const soundsOff = { ...store().soundsOff };

    if (on) delete soundsOff[name];
    else soundsOff[name] = true;

    store().set({ soundsOff });
  },
  setServer: (guildId, change) => {
    const current = store().byServer[guildId] ?? { mode: null, mutedUntil: null, hideMuted: false };

    store().set({ byServer: { ...store().byServer, [guildId]: { ...current, ...change } } });
  },

  setChannel: (channelId, mode) => {
    const byChannel = { ...store().byChannel };

    if (mode === null) delete byChannel[channelId];
    else byChannel[channelId] = mode;

    store().set({ byChannel });
  },
}));

export const serverMuted = (prefs: Pick<NoticePrefs, "byServer">, guildId: string | null | undefined): boolean => {
  if (!guildId) return false;
  const until = prefs.byServer[guildId]?.mutedUntil ?? null;
  return until === -1 || (until !== null && until > Date.now());
};

export const channelMode = (channelId: string): ChannelMode | null =>
  useNotices.getState().byChannel[channelId] ?? null;

export const noticePrefs = (): NoticePrefs => {
  const { set, ...prefs } = useNotices.getState();
  void set;
  return prefs;
};
