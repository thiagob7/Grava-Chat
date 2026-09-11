import { create } from "zustand";

export interface Burst {
  id: number;
  emoji: string;
  url?: string | null;
  x: number;
  y: number;
}

interface SuperReactionState {
  bursts: Burst[];
  fire: (
    emoji: string,
    origin?: { x: number; y: number },
    url?: string | null,
  ) => void;
  end: (id: number) => void;
}

let next = 0;

export const useSuperReaction = create<SuperReactionState>((set) => ({
  bursts: [],

  fire: (emoji, origin, url) =>
    set((s) => ({
      bursts: [
        ...s.bursts,
        {
          id: next++,
          emoji,
          url,
          x: origin?.x ?? window.innerWidth / 2,
          y: origin?.y ?? window.innerHeight - 120,
        },
      ],
    })),

  end: (id) => set((s) => ({ bursts: s.bursts.filter((e) => e.id !== id) })),
}));
