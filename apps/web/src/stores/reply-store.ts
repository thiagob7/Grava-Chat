import { create } from "zustand";

export interface AlvoDaResposta {
  messageId: string;
  channelId: string;
  autor: string;
  autorId: string;
}

interface ReplyState {
  alvo: AlvoDaResposta | null;
  /// se marca o autor no envio — o "@ LIGADO" da barra
  mencionar: boolean;
  responder: (alvo: AlvoDaResposta) => void;
  cancelar: () => void;
  alternarMencao: () => void;
}

/**
 * Quem dispara a resposta é o botão na mensagem; quem a mostra e a envia é o
 * composer, do outro lado da árvore. Uma store evita empurrar o estado até o
 * Chat só para descer de novo por dois caminhos.
 *
 * O `channelId` viaja junto porque a barra não pode reaparecer noutro canal:
 * o composer só mostra o alvo que é do canal dele.
 */
export const useReplyStore = create<ReplyState>((set) => ({
  alvo: null,
  mencionar: true,
  responder: (alvo) => set({ alvo }),
  cancelar: () => set({ alvo: null }),
  alternarMencao: () => set((s) => ({ mencionar: !s.mencionar })),
}));
