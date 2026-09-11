import { create } from "zustand";

const KEY = "gravae:ignorados";

function read(): string[] {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? (JSON.parse(saved) as string[]) : [];
  } catch {
    return [];
  }
}

interface IgnoreStore {
  ignoredList: string[];
  toggle: (userId: string) => void;
  thisIgnored: (userId: string) => boolean;
}

export const useIgnoreStore = create<IgnoreStore>((set, store) => ({
  ignoredList: read(),

  toggle: (userId) => {
    const current = store().ignoredList;
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];

    set({ ignoredList: next });

    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
    }
  },

  thisIgnored: (userId) => store().ignoredList.includes(userId),
}));
