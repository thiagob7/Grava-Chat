import { create } from "zustand";

export type ModoDoCanal = "tudo" | "mencoes" | "nada";

export interface PrefsDoServidor {
  modo: ModoDoCanal | null;
  silenciadoAte: number | null;
  esconderSilenciados: boolean;
  everyone?: boolean;
  cargos?: boolean;
}

export interface PrefsDeAviso {
  aviso: boolean;
  soMencoes: boolean;
  som: boolean;
  contador: boolean;
  porCanal: Record<string, ModoDoCanal>;
  porServidor: Record<string, PrefsDoServidor>;
  sonsDesligados: Record<string, boolean>;
}

const PADRAO: PrefsDeAviso = {
  aviso: true,
  soMencoes: false,
  som: true,
  contador: true,
  porCanal: {},
  porServidor: {},
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
  definirServidor: (guildId: string, mudanca: Partial<PrefsDoServidor>) => void;
  definirSom: (nome: string, ligado: boolean) => void;
}

export const useAvisos = create<StoreDeAvisos>((set, store) => ({
  ...ler(),

  definir: (mudanca) => {
    set(mudanca);

    try {
      const { definir, definirCanal, definirServidor, definirSom, ...prefs } = store();
      void definir;
      void definirCanal;
      void definirServidor;
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
  definirServidor: (guildId, mudanca) => {
    const atual = store().porServidor[guildId] ?? { modo: null, silenciadoAte: null, esconderSilenciados: false };

    store().definir({ porServidor: { ...store().porServidor, [guildId]: { ...atual, ...mudanca } } });
  },

  definirCanal: (channelId, modo) => {
    const porCanal = { ...store().porCanal };

    if (modo === null) delete porCanal[channelId];
    else porCanal[channelId] = modo;

    store().definir({ porCanal });
  },
}));

export const servidorSilenciado = (prefs: Pick<PrefsDeAviso, "porServidor">, guildId: string | null | undefined): boolean => {
  if (!guildId) return false;
  const ate = prefs.porServidor[guildId]?.silenciadoAte ?? null;
  return ate === -1 || (ate !== null && ate > Date.now());
};

export const modoDoCanal = (channelId: string): ModoDoCanal | null =>
  useAvisos.getState().porCanal[channelId] ?? null;

export const prefsDeAviso = (): PrefsDeAviso => {
  const { definir, ...prefs } = useAvisos.getState();
  void definir;
  return prefs;
};
