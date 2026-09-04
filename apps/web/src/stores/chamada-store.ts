import { create } from "zustand";

export interface ChamadaTocando {
  channelId: string;
  userId: string;
  comVideo: boolean;
  desde: number;
}

type ChamadaStore = {
  tocando: ChamadaTocando | null;

  receber: (chamada: Omit<ChamadaTocando, "desde">) => void;
  atualizarVideo: (channelId: string, comVideo: boolean) => void;
  encerrar: (channelId?: string) => void;
};

export const useChamadaStore = create<ChamadaStore>((set, store) => ({
  tocando: null,

  receber: (chamada) => set({ tocando: { ...chamada, desde: Date.now() } }),

  atualizarVideo: (channelId, comVideo) => {
    const atual = store().tocando;
    if (!atual || atual.channelId !== channelId) return;

    set({ tocando: { ...atual, comVideo } });
  },

  encerrar: (channelId) => {
    const atual = store().tocando;
    if (!atual) return;
    if (channelId && atual.channelId !== channelId) return;

    set({ tocando: null });
  },
}));
