import { create } from "zustand";

import { AJUSTES_PADRAO, type AjustesDeVoz, type ModoDeEntrada } from "~/lib/audio-gate";

export interface VoicePrefs extends AjustesDeVoz {
  entradaId: string | null;
  saidaId: string | null;
  volumeSaida: number;
  teclaPtt: string;
  somDaInterface: boolean;
  somDaTela: boolean;
  /**
   * O painel de efeitos sonoros: se toca, e em que volume. Fica aqui, e nao
   * no servidor, porque e escolha de quem ouve — o volume gravado no som vale
   * pra todo mundo, este so vale pra voce, neste aparelho.
   */
  somDoPainel: boolean;
  volumeDoPainel: number;
}

const PADRAO: VoicePrefs = {
  ...AJUSTES_PADRAO,
  entradaId: null,
  saidaId: null,
  volumeSaida: 1,
  teclaPtt: "Space",
  somDaInterface: true,
  somDaTela: true,
  somDoPainel: true,
  volumeDoPainel: 1,
};

const CHAVE = "gravae:voice-prefs";

function ler(): VoicePrefs {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo ? { ...PADRAO, ...(JSON.parse(salvo) as Partial<VoicePrefs>) } : PADRAO;
  } catch {
    return PADRAO;
  }
}

interface VoicePrefsStore extends VoicePrefs {
  definir: (mudanca: Partial<VoicePrefs>) => void;
  restaurarPadrao: () => void;
}

export const useVoicePrefs = create<VoicePrefsStore>((set, store) => ({
  ...ler(),

  definir: (mudanca) => {
    set(mudanca);

    try {
      const { definir, restaurarPadrao, ...prefs } = store();
      void definir;
      void restaurarPadrao;
      localStorage.setItem(CHAVE, JSON.stringify(prefs));
    } catch {
    }
  },

  restaurarPadrao: () => store().definir(PADRAO),
}));

export const ajustesDe = (prefs: VoicePrefs): AjustesDeVoz => ({
  ganhoEntrada: prefs.ganhoEntrada,
  modo: prefs.modo,
  sensibilidadeAutomatica: prefs.sensibilidadeAutomatica,
  limiar: prefs.limiar,
  supressaoDeRuido: prefs.supressaoDeRuido,
});

export type { ModoDeEntrada };
