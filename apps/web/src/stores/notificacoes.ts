import { create } from "zustand";

export type ModoDoCanal = "tudo" | "mencoes" | "nada";

export interface PrefsDeAviso {
  aviso: boolean;
  soMencoes: boolean;
  som: boolean;
  contador: boolean;
  porCanal: Record<string, ModoDoCanal>;
  sonsDesligados: Record<string, boolean>;
}

const PADRAO: PrefsDeAviso = {
  aviso: true,
  soMencoes: false,
  som: true,
  contador: true,
  porCanal: {},
  sonsDesligados: {},
};

const CHAVE = "gravae:avisos";

function ler(): PrefsDeAviso {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo ? { ...PADRAO, ...(JSON.parse(salvo) as Partial<PrefsDeAviso>) } : PADRAO;
  } catch {
    return PADRAO;
  }
}

interface StoreDeAvisos extends PrefsDeAviso {
  definir: (mudanca: Partial<PrefsDeAviso>) => void;
  definirCanal: (channelId: string, modo: ModoDoCanal | null) => void;
  definirSom: (nome: string, ligado: boolean) => void;
}

export const useAvisos = create<StoreDeAvisos>((set, store) => ({
  ...ler(),

  definir: (mudanca) => {
    set(mudanca);

    try {
      const { definir, definirCanal, definirSom, ...prefs } = store();
      void definir;
      void definirCanal;
      void definirSom;
      localStorage.setItem(CHAVE, JSON.stringify(prefs));
    } catch {
    }
  },

  definirSom: (nome, ligado) => {
    const sonsDesligados = { ...store().sonsDesligados };

    if (ligado) delete sonsDesligados[nome];
    else sonsDesligados[nome] = true;

    store().definir({ sonsDesligados });
  },
  definirCanal: (channelId, modo) => {
    const porCanal = { ...store().porCanal };

    if (modo === null) delete porCanal[channelId];
    else porCanal[channelId] = modo;

    store().definir({ porCanal });
  },
}));

export const modoDoCanal = (channelId: string): ModoDoCanal | null =>
  useAvisos.getState().porCanal[channelId] ?? null;

export const prefsDeAviso = (): PrefsDeAviso => {
  const { definir, ...prefs } = useAvisos.getState();
  void definir;
  return prefs;
};
