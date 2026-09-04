import { create } from "zustand";

import type { ModoDeLeitura } from "~/lib/voz";

export type Tema = "escuro" | "mais-escuro" | "claro" | "sistema" | "gravae";
export type Densidade = "confortavel" | "compacta";
export type QuandoMostrarSpoiler = "ao-clicar" | "sempre";

export interface PrefsDeAparencia {
  tema: Tema;
  destaque: string | null;
  densidade: Densidade;

  zoomDoApp: number;
  escalaDoChat: number;

  cantosArredondados: boolean;
  listaDeMembros: boolean;

  faixaDoServidor: boolean;
  lembrarCategoriasFechadas: boolean;

  reduzirAnimacao: boolean;
  focoSempreVisivel: boolean;

  lerEmVozAlta: ModoDeLeitura;
  vozDaLeitura: string | null;
  velocidadeDaLeitura: number;

  horaEm24h: boolean;

  imagensDeLinks: boolean;
  imagensEnviadas: boolean;
  previaDeLinks: boolean;
  reacoes: boolean;
  spoilers: QuandoMostrarSpoiler;
  avatares: boolean;

  sugestoes: boolean;
  emoticons: boolean;
  botaoDeEnviar: boolean;

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

  zoomDoApp: 100,
  escalaDoChat: 100,

  cantosArredondados: true,
  listaDeMembros: true,
  faixaDoServidor: true,
  lembrarCategoriasFechadas: true,

  reduzirAnimacao: false,
  focoSempreVisivel: false,
  lerEmVozAlta: "nunca",
  vozDaLeitura: null,
  velocidadeDaLeitura: 1,
  horaEm24h: true,

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

const NOMES_ANTIGOS: Record<string, Tema> = {
  fluxer: "escuro",
  "fluxer-carvao": "mais-escuro",
  "fluxer-claro": "claro",
  indigo: "escuro",
  "indigo-carvao": "mais-escuro",
  "indigo-claro": "claro",
};

function ler(): PrefsDeAparencia {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (!salvo) return PADRAO;

    const prefs = {
      ...PADRAO,
      ...(JSON.parse(salvo) as Partial<PrefsDeAparencia>),
    };
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
    } catch {}
  },

  restaurarPadrao: () => store().definir(PADRAO),
}));

export const prefsDeAparencia = (): PrefsDeAparencia => {
  const { definir, restaurarPadrao, ...prefs } = useAparencia.getState();
  void definir;
  void restaurarPadrao;
  return prefs;
};

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
