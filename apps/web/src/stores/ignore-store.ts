import { create } from "zustand";

const CHAVE = "gravae:ignorados";

function ler(): string[] {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo ? (JSON.parse(salvo) as string[]) : [];
  } catch {
    return [];
  }
}

interface IgnoreStore {
  ignorados: string[];
  alternar: (userId: string) => void;
  estaIgnorado: (userId: string) => boolean;
}

export const useIgnoreStore = create<IgnoreStore>((set, store) => ({
  ignorados: ler(),

  alternar: (userId) => {
    const atual = store().ignorados;
    const proximo = atual.includes(userId)
      ? atual.filter((id) => id !== userId)
      : [...atual, userId];

    set({ ignorados: proximo });

    try {
      localStorage.setItem(CHAVE, JSON.stringify(proximo));
    } catch {
    }
  },

  estaIgnorado: (userId) => store().ignorados.includes(userId),
}));
