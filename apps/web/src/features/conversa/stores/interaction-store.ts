import { create } from "zustand";

type InteractionStore = {
  finished: Record<string, true>;

  markFinished: (interactionId: string) => void;
  consume: (interactionId: string) => boolean;
};

export const useInteractionStore = create<InteractionStore>((set, get) => ({
  finished: {},

  markFinished: (interactionId) => set((s) => ({ finished: { ...s.finished, [interactionId]: true } })),

  consume: (interactionId) => {
    if (!get().finished[interactionId]) return false;

    set((s) => {
      const { [interactionId]: _, ...rest } = s.finished;
      return { finished: rest };
    });
    return true;
  },
}));
