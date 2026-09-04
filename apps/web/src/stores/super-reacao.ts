import { create } from "zustand";

export interface Explosao {
  id: number;
  emoji: string;
  url?: string | null;
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
