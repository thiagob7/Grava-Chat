import { create } from "zustand";

export interface Explosao {
  id: number;
  emoji: string;
  /// emoji do servidor: a partícula é a imagem, senão `:nome:` voaria como
  /// texto pela tela
  url?: string | null;
  /// de onde as partículas saem, em pixels da janela; sem origem conhecida
  /// (mensagem fora da tela) a chuva cai do rodapé, no meio
  x: number;
  y: number;
}

interface SuperReacaoState {
  explosoes: Explosao[];
  disparar: (
    emoji: string,
    origem?: { x: number; y: number },
    url?: string | null,
  ) => void;
  encerrar: (id: number) => void;
}

let proximo = 0;

/**
 * A fila de animações de super reação. Fica fora do React porque quem dispara
 * é o socket (qualquer pessoa do canal) e quem desenha é um componente só, no
 * topo do app — a animação não pode morrer junto com a mensagem que a causou,
 * que some se a lista rolar.
 */
export const useSuperReacao = create<SuperReacaoState>((set) => ({
  explosoes: [],

  disparar: (emoji, origem, url) =>
    set((s) => ({
      explosoes: [
        ...s.explosoes,
        {
          id: proximo++,
          emoji,
          url,
          x: origem?.x ?? window.innerWidth / 2,
          y: origem?.y ?? window.innerHeight - 120,
        },
      ],
    })),

  encerrar: (id) => set((s) => ({ explosoes: s.explosoes.filter((e) => e.id !== id) })),
}));
