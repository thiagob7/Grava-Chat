import { create } from "zustand";

export interface ModerationTarget {
  guildId: string;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface ModerationStore {
  target: ModerationTarget | null;
  open: (target: ModerationTarget) => void;
  close: () => void;
}

export const useModeration = create<ModerationStore>((set) => ({
  target: null,
  open: (target) => set({ target }),
  close: () => set({ target: null }),
}));
