import { create } from "zustand";
import type { EstadoPtt } from "@gravae/shared";

interface PttGlobal {
  estado: EstadoPtt | null;
  definir: (estado: EstadoPtt | null) => void;
}

export const usePttGlobal = create<PttGlobal>((set) => ({
  estado: null,
  definir: (estado) => set({ estado }),
}));
