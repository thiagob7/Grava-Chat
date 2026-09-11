import { create } from "zustand";

interface FavoritesStore {
  channels: string[];
  toggle: (channelId: string) => void;
  isFavorite: (channelId: string) => boolean;
}

const KEY = "gravae:canais-favoritos";

function read(): string[] {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? (JSON.parse(saved) as string[]) : [];
  } catch {
    return [];
  }
}

export const useFavorites = create<FavoritesStore>((set, store) => ({
  channels: read(),

  toggle: (channelId) => {
    const current = store().channels;
    const channels = current.includes(channelId)
      ? current.filter((id) => id !== channelId)
      : [...current, channelId];

    set({ channels });

    try {
      localStorage.setItem(KEY, JSON.stringify(channels));
    } catch {
    }
  },

  isFavorite: (channelId) => store().channels.includes(channelId),
}));
