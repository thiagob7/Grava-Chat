import { create } from "zustand";

/**
 * A chamada de privado que está tocando pra você agora.
 *
 * Mora num store próprio, e não no `voice-store`, porque são coisas de
 * momentos diferentes: o `voice-store` descreve a chamada em que você ESTÁ, e
 * isto aqui descreve uma em que você ainda não entrou — e pode nunca entrar.
 *
 * Só cabe uma por vez. Se um segundo amigo ligar enquanto o primeiro toca, a
 * chamada nova substitui: duas telas de "atender/recusar" empilhadas seriam
 * pior que perder a segunda, e a pessoa liga de novo.
 */
export interface ChamadaTocando {
  /// o canal da conversa — é nele que se entra ao atender
  channelId: string;
  /// quem está ligando
  userId: string;
  /// a pessoa ligou com a câmera aberta
  comVideo: boolean;
  /// quando começou a tocar, pra desistir sozinho depois de um tempo
  desde: number;
}

type ChamadaStore = {
  tocando: ChamadaTocando | null;

  receber: (chamada: Omit<ChamadaTocando, "desde">) => void;
  /// a pessoa ligou e depois abriu a câmera: vira chamada de vídeo enquanto toca
  atualizarVideo: (channelId: string, comVideo: boolean) => void;
  /// atendida, recusada, ou o outro lado desistiu
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

  /*
    Sem `channelId` encerra o que estiver tocando. Com `channelId`, só encerra
    se for aquela chamada — assim um "fulano saiu" de uma conversa antiga não
    derruba o telefone que está tocando agora.
  */
  encerrar: (channelId) => {
    const atual = store().tocando;
    if (!atual) return;
    if (channelId && atual.channelId !== channelId) return;

    set({ tocando: null });
  },
}));
