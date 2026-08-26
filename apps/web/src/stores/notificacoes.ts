import { create } from "zustand";

/**
 * Como você quer ser avisado.
 *
 * Fica no navegador, não na conta: "me avise" é uma decisão sobre ESTE
 * aparelho. A mesma conta aberta no trabalho e no celular não quer,
 * necessariamente, o mesmo barulho nos dois.
 */
export interface PrefsDeAviso {
  /// aviso do sistema (a janelinha do macOS/Windows)
  aviso: boolean;
  /// só menção, ou toda mensagem
  soMencoes: boolean;
  som: boolean;
  /// contador no título da aba e no ícone do app
  contador: boolean;
}

const PADRAO: PrefsDeAviso = { aviso: true, soMencoes: false, som: true, contador: true };

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
}

export const useAvisos = create<StoreDeAvisos>((set, store) => ({
  ...ler(),

  definir: (mudanca) => {
    set(mudanca);

    try {
      const { definir, ...prefs } = store();
      void definir;
      localStorage.setItem(CHAVE, JSON.stringify(prefs));
    } catch {
    }
  },
}));

export const prefsDeAviso = (): PrefsDeAviso => {
  const { definir, ...prefs } = useAvisos.getState();
  void definir;
  return prefs;
};
