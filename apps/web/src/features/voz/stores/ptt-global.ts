import { create } from "zustand";
import type { StatePtt } from "@gravae/shared";

interface PttGlobal {
  state: StatePtt | null;
  set: (state: StatePtt | null) => void;
}

export const usePttGlobal = create<PttGlobal>((set) => ({
  state: null,
  set: (state) => set({ state }),
}));
