import { create } from "zustand";

export interface CallPlaying {
  channelId: string;
  userId: string;
  withVideo: boolean;
  since: number;
}

type CallStore = {
  playing: CallPlaying | null;

  receive: (call: Omit<CallPlaying, "since">) => void;
  updateVideo: (channelId: string, withVideo: boolean) => void;
  end: (channelId?: string) => void;
};

export const useCallStore = create<CallStore>((set, store) => ({
  playing: null,

  receive: (call) => set({ playing: { ...call, since: Date.now() } }),

  updateVideo: (channelId, withVideo) => {
    const current = store().playing;
    if (!current || current.channelId !== channelId) return;

    set({ playing: { ...current, withVideo } });
  },

  end: (channelId) => {
    const current = store().playing;
    if (!current) return;
    if (channelId && current.channelId !== channelId) return;

    set({ playing: null });
  },
}));
