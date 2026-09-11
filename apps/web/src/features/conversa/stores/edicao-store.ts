import { create } from "zustand";

type EditStore = {
  request: string | null;

  askFor: (messageId: string) => void;
  collapse: () => void;
};

export const useEditStore = create<EditStore>((set) => ({
  request: null,

  askFor: (messageId) => set({ request: messageId }),
  collapse: () => set({ request: null }),
}));
