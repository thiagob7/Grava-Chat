import { create } from "zustand";

import type { Combo } from "~/features/configuracoes/lib/atalhos";

export interface ShortcutsPrefs {
  swapped: Record<string, Combo>;
  off: string[];
}

const DEFAULT: ShortcutsPrefs = { swapped: {}, off: [] };

const KEY = "gravae:atalhos";

function read(): ShortcutsPrefs {
  try {
    const saved = localStorage.getItem(KEY);
    if (!saved) return DEFAULT;

    return { ...DEFAULT, ...(JSON.parse(saved) as Partial<ShortcutsPrefs>) };
  } catch {
    return DEFAULT;
  }
}

interface ShortcutsStore extends ShortcutsPrefs {
  swap: (id: string, combo: Combo) => void;
  defaultGive: (id: string) => void;
  toggle: (id: string, on: boolean) => void;
  restoreEverything: () => void;
}

const keep = (prefs: ShortcutsPrefs) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {}
};

export const useShortcuts = create<ShortcutsStore>((set, store) => ({
  ...read(),

  swap: (id, combo) => {
    const swapped = { ...store().swapped, [id]: combo };

    set({ swapped });
    keep({ swapped, off: store().off });
  },

  defaultGive: (id) => {
    const swapped = { ...store().swapped };
    delete swapped[id];

    set({ swapped });
    keep({ swapped, off: store().off });
  },

  toggle: (id, on) => {
    const off = on
      ? store().off.filter((other) => other !== id)
      : [...new Set([...store().off, id])];

    set({ off });
    keep({ swapped: store().swapped, off });
  },

  restoreEverything: () => {
    set(DEFAULT);
    keep(DEFAULT);
  },
}));

export const comboDe = (id: string, fallback: Combo): Combo =>
  useShortcuts.getState().swapped[id] ?? fallback;
