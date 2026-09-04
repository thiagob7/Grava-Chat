import { create } from "zustand";

type EdicaoStore = {
  pedido: string | null;

  pedir: (messageId: string) => void;
  recolher: () => void;
};

export const useEdicaoStore = create<EdicaoStore>((set) => ({
  pedido: null,

  pedir: (messageId) => set({ pedido: messageId }),
  recolher: () => set({ pedido: null }),
}));
