import { create } from "zustand";

/**
 * Como você quer ser avisado.
 *
 * Fica no navegador, não na conta: "me avise" é uma decisão sobre ESTE
 * aparelho. A mesma conta aberta no trabalho e no celular não quer,
 * necessariamente, o mesmo barulho nos dois.
 */
/// O que um canal específico faz com as mensagens que chegam nele.
export type ModoDoCanal = "tudo" | "mencoes" | "nada";

export interface PrefsDeAviso {
  /// aviso do sistema (a janelinha do macOS/Windows)
  aviso: boolean;
  /// só menção, ou toda mensagem
  soMencoes: boolean;
  som: boolean;
  /// contador no título da aba e no ícone do app
  contador: boolean;
  /**
   * Exceções por canal, para o canal barulhento que você não quer largar.
   *
   * Só o que foge do padrão mora aqui: canal sem entrada segue a preferência
   * geral. Fica no aparelho como o resto — silenciar no computador do
   * trabalho não tem por que calar o celular.
   */
  porCanal: Record<string, ModoDoCanal>;
  /**
   * Sons desligados um a um.
   *
   * Só o que foge do padrão mora aqui, como no `porCanal`: som ausente do mapa
   * está ligado. Guardar os treze com `true` engordaria o armazenamento e, pior,
   * congelaria a lista — som novo no app nasceria DESLIGADO para quem já tem
   * preferência salva, e ninguém entenderia por quê.
   */
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

  /*
    Liga ou desliga um som. Ligar APAGA a entrada em vez de gravar `false`:
    o mapa guarda só o que foge do padrão, então o que está ligado não precisa
    estar escrito em lugar nenhum.
  */
  definirSom: (nome, ligado) => {
    const sonsDesligados = { ...store().sonsDesligados };

    if (ligado) delete sonsDesligados[nome];
    else sonsDesligados[nome] = true;

    store().definir({ sonsDesligados });
  },
  definirCanal: (channelId, modo) => {
    const porCanal = { ...store().porCanal };

    /// Voltar ao padrão APAGA a entrada, não grava "tudo": assim o canal
    /// volta a seguir a preferência geral quando ela mudar.
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
