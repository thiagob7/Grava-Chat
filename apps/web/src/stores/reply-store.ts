import { create } from "zustand";

export interface AlvoDaResposta {
  messageId: string;
  channelId: string;
  autor: string;
  autorId: string;
}

interface ReplyState {
  alvo: AlvoDaResposta | null;
  mencionar: boolean;
  responder: (alvo: AlvoDaResposta) => void;
  cancelar: () => void;
  alternarMencao: () => void;
}

export const useReplyStore = create<ReplyState>((set) => ({
  alvo: null,
  mencionar: true,
  responder: (alvo) => set({ alvo }),
  cancelar: () => set({ alvo: null }),
  alternarMencao: () => set((s) => ({ mencionar: !s.mencionar })),
}));
