import { create } from "zustand";

import { DEFAULT_ANGLE, DEFAULT_INTENSITY, MAX_COLORS, type AppColors } from "~/features/tema/lib/app-colors";

const KEY = "gravae:cores-do-app";

const EMPTY: AppColors = { colors: [], angle: DEFAULT_ANGLE, intensity: DEFAULT_INTENSITY };

function read(): AppColors {
  try {
    const saved = localStorage.getItem(KEY);
    if (!saved) return EMPTY;

    const parsed = { ...EMPTY, ...(JSON.parse(saved) as Partial<AppColors>) };
    return { ...parsed, colors: (parsed.colors ?? []).filter(Boolean).slice(0, MAX_COLORS) };
  } catch {
    return EMPTY;
  }
}

interface AppColorsStore extends AppColors {
  set: (change: Partial<AppColors>) => void;
  clear: () => void;
}

export const useAppColors = create<AppColorsStore>((set, store) => ({
  ...read(),

  set: (change) => {
    const { set: _set, clear: _clear, ...current } = store();
    const next = { ...current, ...change };

    set(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
    }
  },

  clear: () => {
    set(EMPTY);
    try {
      localStorage.removeItem(KEY);
    } catch {
    }
  },
}));
