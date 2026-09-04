import { create } from "zustand";

interface StoreDeFavoritos {
  canais: string[];
  alternar: (channelId: string) => void;
  ehFavorito: (channelId: string) => boolean;
}

const CHAVE = "gravae:canais-favoritos";

function ler(): string[] {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo ? (JSON.parse(salvo) as string[]) : [];
  } catch {
    return [];
  }
}

export const useFavoritos = create<StoreDeFavoritos>((set, store) => ({
  canais: ler(),

  alternar: (channelId) => {
    const atuais = store().canais;
    const canais = atuais.includes(channelId)
      ? atuais.filter((id) => id !== channelId)
      : [...atuais, channelId];

    set({ canais });

    try {
      localStorage.setItem(CHAVE, JSON.stringify(canais));
    } catch {
      /// Sem localStorage a estrela vale só até recarregar — melhor que travar.
    }
  },

  ehFavorito: (channelId) => store().canais.includes(channelId),
}));
