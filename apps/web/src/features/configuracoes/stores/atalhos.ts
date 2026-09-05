import { create } from "zustand";

import type { Combo } from "~/features/configuracoes/lib/atalhos";

export interface PrefsDeAtalhos {
  trocados: Record<string, Combo>;
  desligados: string[];
}

const PADRAO: PrefsDeAtalhos = { trocados: {}, desligados: [] };

const CHAVE = "gravae:atalhos";

function ler(): PrefsDeAtalhos {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (!salvo) return PADRAO;

    return { ...PADRAO, ...(JSON.parse(salvo) as Partial<PrefsDeAtalhos>) };
  } catch {
    return PADRAO;
  }
}

interface StoreDeAtalhos extends PrefsDeAtalhos {
  trocar: (id: string, combo: Combo) => void;
  devolverPadrao: (id: string) => void;
  alternar: (id: string, ligado: boolean) => void;
  restaurarTudo: () => void;
}

const guardar = (prefs: PrefsDeAtalhos) => {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(prefs));
  } catch {}
};

export const useAtalhos = create<StoreDeAtalhos>((set, store) => ({
  ...ler(),

  trocar: (id, combo) => {
    const trocados = { ...store().trocados, [id]: combo };

    set({ trocados });
    guardar({ trocados, desligados: store().desligados });
  },

  devolverPadrao: (id) => {
    const trocados = { ...store().trocados };
    delete trocados[id];

    set({ trocados });
    guardar({ trocados, desligados: store().desligados });
  },

  alternar: (id, ligado) => {
    const desligados = ligado
      ? store().desligados.filter((outro) => outro !== id)
      : [...new Set([...store().desligados, id])];

    set({ desligados });
    guardar({ trocados: store().trocados, desligados });
  },

  restaurarTudo: () => {
    set(PADRAO);
    guardar(PADRAO);
  },
}));

export const comboDe = (id: string, padrao: Combo): Combo =>
  useAtalhos.getState().trocados[id] ?? padrao;
