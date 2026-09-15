import { create } from "zustand";

type DismissedStore = {
  ids: Record<string, true>;

  dismiss: (messageId: string) => void;
};

export const useDismissedStore = create<DismissedStore>((set) => ({
  ids: {},

  dismiss: (messageId) => set((s) => ({ ids: { ...s.ids, [messageId]: true } })),
}));
