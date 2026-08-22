import { create } from "zustand";

import { AJUSTES_PADRAO, type AjustesDeVoz, type ModoDeEntrada } from "~/lib/audio-gate";

/**
 * Preferências de áudio. Ficam em localStorage e NÃO na conta: o id do
 * microfone e o volume do fone são deste computador. Levar isso pra conta faria
 * a pessoa entrar no PC do amigo e sair com o microfone errado selecionado.
 */
export interface VoicePrefs extends AjustesDeVoz {
  /** null = "padrão do sistema", que é o que o navegador escolher na hora */
  entradaId: string | null;
  saidaId: string | null;
  /** volume de quem você ouve, 0..1 */
  volumeSaida: number;
  /** tecla do push-to-talk, no formato de KeyboardEvent.code */
  teclaPtt: string;
  /** bipes de entrar/sair/mutar. Desligável: em live incomoda. */
  somDaInterface: boolean;
  /**
   * Capturar o som do sistema junto com a tela.
   *
   * É o que faz assistir vídeo em conjunto funcionar — e também a causa do eco
   * quando quem transmite está ouvindo a chamada pelas CAIXAS: o som capturado
   * inclui a voz de todo mundo saindo do alto-falante, e volta pra sala.
   */
  somDaTela: boolean;
}

const PADRAO: VoicePrefs = {
  ...AJUSTES_PADRAO,
  entradaId: null,
  saidaId: null,
  volumeSaida: 1,
  teclaPtt: "Space",
  somDaInterface: true,
  somDaTela: true,
};

const CHAVE = "gravae:voice-prefs";

function ler(): VoicePrefs {
  try {
    const salvo = localStorage.getItem(CHAVE);
    // merge com o padrão: uma versão nova pode ter campo que o salvo não tem
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
      /* modo privado sem storage: vale só nesta sessão */
    }
  },

  restaurarPadrao: () => store().definir(PADRAO),
}));

/** Só o pedaço que o processador de áudio entende. */
export const ajustesDe = (prefs: VoicePrefs): AjustesDeVoz => ({
  ganhoEntrada: prefs.ganhoEntrada,
  modo: prefs.modo,
  sensibilidadeAutomatica: prefs.sensibilidadeAutomatica,
  limiar: prefs.limiar,
  supressaoDeRuido: prefs.supressaoDeRuido,
});

export type { ModoDeEntrada };
