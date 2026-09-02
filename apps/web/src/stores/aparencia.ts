import { create } from "zustand";

export type Tema =
  | "escuro"
  | "mais-escuro"
  | "claro"
  | "sistema"
  | "gravae"
  | "indigo"
  | "indigo-carvao"
  | "indigo-claro";
export type Densidade = "confortavel" | "compacta";
export type QuandoMostrarSpoiler = "ao-clicar" | "sempre";

/**
 * Aparência: o que este aparelho mostra e como.
 *
 * Tudo aqui é do navegador, não da conta — do mesmo jeito que os avisos. Tema
 * é decisão de onde você está sentado: a tela do trabalho e a da sala não
 * pedem a mesma coisa.
 */
export interface PrefsDeAparencia {
  tema: Tema;
  /// o vermelho da marca é o padrão; qualquer cor daqui vira o `--color-brand`
  destaque: string | null;
  densidade: Densidade;

  /// Mensagens
  imagensDeLinks: boolean;
  imagensEnviadas: boolean;
  previaDeLinks: boolean;
  reacoes: boolean;
  spoilers: QuandoMostrarSpoiler;
  avatares: boolean;

  /// Caixa de chat
  sugestoes: boolean;
  emoticons: boolean;
  botaoDeEnviar: boolean;

  /// Modo streamer
  modoStreamer: boolean;
  streamerEscondeDados: boolean;
  streamerEscondeConvites: boolean;
  streamerSemSom: boolean;
  streamerSemAvisos: boolean;
}

const PADRAO: PrefsDeAparencia = {
  tema: "escuro",
  destaque: null,
  densidade: "confortavel",

  imagensDeLinks: true,
  imagensEnviadas: true,
  previaDeLinks: true,
  reacoes: true,
  spoilers: "ao-clicar",
  avatares: true,

  sugestoes: true,
  emoticons: true,
  botaoDeEnviar: true,

  modoStreamer: false,
  streamerEscondeDados: true,
  streamerEscondeConvites: true,
  streamerSemSom: true,
  streamerSemAvisos: true,
};

const CHAVE = "gravae:aparencia";

/*
  Os temas escuros de acento roxo mudaram de nome depois de já estarem
  escolhidos em alguns aparelhos. Quem tem o nome antigo guardado continua
  vendo o mesmo tema — sem isto, o `data-tema` viraria um valor que o CSS não
  conhece e a pessoa cairia num escuro genérico sem entender por quê.
*/
const NOMES_ANTIGOS: Record<string, Tema> = {
  fluxer: "indigo",
  "fluxer-carvao": "indigo-carvao",
  "fluxer-claro": "indigo-claro",
};

function ler(): PrefsDeAparencia {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (!salvo) return PADRAO;

    const prefs = { ...PADRAO, ...(JSON.parse(salvo) as Partial<PrefsDeAparencia>) };
    return { ...prefs, tema: NOMES_ANTIGOS[prefs.tema] ?? prefs.tema };
  } catch {
    return PADRAO;
  }
}

interface StoreDeAparencia extends PrefsDeAparencia {
  definir: (mudanca: Partial<PrefsDeAparencia>) => void;
  restaurarPadrao: () => void;
}

export const useAparencia = create<StoreDeAparencia>((set, store) => ({
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

/// Para quem precisa das preferências fora de um componente — o som de aviso,
/// por exemplo, que toca de dentro de um `handler` do socket.
export const prefsDeAparencia = (): PrefsDeAparencia => {
  const { definir, restaurarPadrao, ...prefs } = useAparencia.getState();
  void definir;
  void restaurarPadrao;
  return prefs;
};

/**
 * As oito cores de destaque.
 *
 * Poucas e escolhidas: o Discord abre um seletor de gradiente inteiro, e o
 * resultado é gente com o app ilegível. Todas aqui foram medidas contra o
 * fundo escuro e o claro — texto branco em cima de qualquer uma se lê.
 */
export const CORES_DE_DESTAQUE = [
  { nome: "Gravaê", valor: "#d30404" },
  { nome: "Laranja", valor: "#e2620d" },
  { nome: "Âmbar", valor: "#b7791f" },
  { nome: "Verde", valor: "#0f8a4b" },
  { nome: "Turquesa", valor: "#0d7d8c" },
  { nome: "Azul", valor: "#1f5fd0" },
  { nome: "Violeta", valor: "#6b3fd4" },
  { nome: "Rosa", valor: "#c02b7a" },
] as const;
