import { create } from "zustand";

interface ConnectionStore {
  connected: boolean;
  droppedAt: number | null;
  attempts: number;
  alreadyConnected: boolean;
  didConnect: () => void;
  dropped: () => void;
  trying: (n: number) => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  connected: false,
  droppedAt: null,
  attempts: 0,
  alreadyConnected: false,

  didConnect: () => set({ connected: true, droppedAt: null, attempts: 0, alreadyConnected: true }),
  dropped: () =>
    set((state) =>
      state.connected || state.droppedAt === null
        ? { connected: false, droppedAt: Date.now() }
        : { connected: false },
    ),
  trying: (n) => set({ attempts: n }),
}));
