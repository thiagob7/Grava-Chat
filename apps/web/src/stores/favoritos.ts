import { create } from "zustand";

/**
 * Os canais que você marcou com a estrela.
 *
 * Fica no aparelho, como o resto das preferências de visualização: favoritar é
 * dizer "quero este à mão", e o que está à mão no computador do trabalho não é
 * o mesmo que no de casa.
 *
 * Guardamos só os ids marcados. Canal apagado some da lista sozinho — a barra
 * lateral só mostra o que ainda existe no servidor.
 */
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
