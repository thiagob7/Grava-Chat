import { create } from "zustand";

import existeNaReferencia from "~/features/configuracoes/lib/existe-na-referencia.json";

import { lerCabecalhoDoTema } from "@gravae/shared";

import {
  CORRECOES_DE_TEMA,
  pareceTemaDeFora,
} from "~/features/configuracoes/lib/correcoes-de-tema";
import { resolverAtivos } from "~/features/configuracoes/lib/ativos-do-tema";
import {
  completarComDerivacao,
  montarTema,
} from "~/features/configuracoes/lib/cores-mae";
import {
  ID_DO_ESCUDO,
  cssDoEscudo,
  medirBase,
} from "~/features/configuracoes/lib/escudo-do-estudio";
import { avisarTemaAplicado } from "~/features/configuracoes/lib/evento-de-tema";
import {
  traduzirSeletoresTravados,
  filtrarRegrasMortas,
} from "~/features/configuracoes/lib/normalizar-tema";
import { temaDesligadoPelaUrl } from "~/features/configuracoes/lib/saida-de-emergencia";
import {
  NOMES_DE_ORIGEM,
  nomesDeclaradosNoTema,
  traduzirTema,
} from "~/features/configuracoes/lib/ponte-de-tema";

export interface TemaSalvo {
  id: string;
  nome: string;
  autor?: string | null;
  versao?: string | null;
  descricao?: string | null;
  tags?: string[];
  substituicoes: Record<string, string>;
  coresMae?: Record<string, string>;
  saturacao?: number;
  manuais?: Record<string, string>;
  css: string;
  aRisca?: boolean | null;
  soOQueExisteLa?: boolean | null;
}

export interface AtivoDoTema {
  id: string;
  nome: string;
  url: string;
  tipo: string;
}

interface EstadoDoEstudio {
  substituicoes: Record<string, string>;
  coresMae: Record<string, string>;
  saturacao: number;
  manuais: Record<string, string>;
  css: string;
  biblioteca: TemaSalvo[];
  ativos: AtivoDoTema[];
  ativoId: string | null;
  aRisca: boolean | null;
  soOQueExisteLa: boolean | null;
}

interface EstudioStore extends EstadoDoEstudio {
  definirToken: (nome: string, valor: string | null) => void;
  definirCorMae: (id: string, valor: string | null) => void;
  definirSaturacao: (fator: number) => void;
  definirCss: (css: string) => void;
  salvarNaBiblioteca: (nome: string) => void;
  aplicarDaBiblioteca: (id: string) => void;
  apagarDaBiblioteca: (id: string) => void;
  importar: (tema: { substituicoes?: Record<string, string>; css?: string; nome?: string }) => void;
  importarCssComoTema: (css: string, nomeDoArquivo?: string) => string;
  atualizarNaBiblioteca: (id: string, dados: Partial<Omit<TemaSalvo, "id">>) => void;
  duplicarDaBiblioteca: (id: string) => void;
  alternarTema: (id: string) => void;
  definirARisca: (aRisca: boolean) => void;
  definirSoOQueExisteLa: (ligado: boolean) => void;
  importarBiblioteca: (temas: TemaSalvo[]) => void;
  guardarAtivo: (ativo: Omit<AtivoDoTema, "id">) => void;
  apagarAtivo: (id: string) => void;
  limparSubstituicoes: () => void;
  limparTudo: () => void;
}

const CHAVE = "gravae:estudio";

let canal: BroadcastChannel | null = null;
const VAZIO: EstadoDoEstudio = {
  substituicoes: {},
  coresMae: {},
  saturacao: 1,
  manuais: {},
  css: "",
  biblioteca: [],
  ativos: [],
  ativoId: null,
  aRisca: null,
  soOQueExisteLa: null,
};

function ler(): EstadoDoEstudio {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (!salvo) return VAZIO;

    const guardado = JSON.parse(salvo) as Partial<EstadoDoEstudio>;

    const escolheuARisca = (guardado.biblioteca ?? []).some((t) => t.aRisca !== undefined);

    return {
      ...VAZIO,
      ...guardado,
      manuais: guardado.manuais ?? guardado.substituicoes ?? {},
      aRisca: escolheuARisca ? (guardado.aRisca ?? null) : null,
    };
  } catch {
    return VAZIO;
  }
}

const SEM_TEMA = { coresMae: {}, saturacao: 1, manuais: {} };

function doTema(tema: TemaSalvo) {
  return {
    coresMae: { ...(tema.coresMae ?? {}) },
    saturacao: tema.saturacao ?? 1,
    manuais: { ...(tema.manuais ?? tema.substituicoes) },
  };
}

const ID_DO_ESTILO = "gc-estudio-css";
const ID_DAS_CORRECOES = "gc-correcoes-de-tema";

const ehAJanelaDoEstudio = () =>
  typeof window !== "undefined" && window.location.pathname === "/estudio";

let escritos = new Set<string>();

function aplicar(estado: EstadoDoEstudio) {
  const raiz = document.documentElement;

  for (const nome of escritos) {
    if (!(nome in estado.substituicoes)) raiz.style.removeProperty(nome);
  }

  escritos = new Set(Object.keys(estado.substituicoes));

  if (ehAJanelaDoEstudio() || temaDesligadoPelaUrl()) {
    avisarTemaAplicado();
    return;
  }

  for (const [nome, valor] of Object.entries(estado.substituicoes)) {
    raiz.style.setProperty(nome, valor);
  }

  if (estado.saturacao === 1) raiz.style.removeProperty("--saturation-factor");
  else raiz.style.setProperty("--saturation-factor", String(estado.saturacao));

  let estilo = document.getElementById(ID_DO_ESTILO);
  if (!estilo) {
    estilo = document.createElement("style");
    estilo.id = ID_DO_ESTILO;
    document.head.appendChild(estilo);
  }

  const doAtivo = estado.biblioteca.find((t) => t.id === estado.ativoId);
  const escolha = doAtivo ? doAtivo.aRisca : estado.aRisca;

  const aRisca = escolha ?? false;

  const escolhaDeExistir = doAtivo ? doAtivo.soOQueExisteLa : estado.soOQueExisteLa;
  const soOQueExisteLa = escolhaDeExistir ?? true;
  const cssVisto = soOQueExisteLa ? filtrarRegrasMortas(estado.css, existeNaReferencia) : estado.css;

  const resolvido = resolverAtivos(
    aRisca ? cssVisto : traduzirSeletoresTravados(cssVisto),
    estado.ativos,
  );

  faltandoAgora = resolvido.faltando;
  estilo.textContent = resolvido.css;

  let correcoes = document.getElementById(ID_DAS_CORRECOES);

  if (pareceTemaDeFora(estado.css)) {
    if (!correcoes) {
      correcoes = document.createElement("style");
      correcoes.id = ID_DAS_CORRECOES;
      document.head.appendChild(correcoes);
    }

    correcoes.textContent = CORRECOES_DE_TEMA;
  } else {
    correcoes?.remove();
  }

  aplicarPonte(estado);
  aplicarEscudo();
  avisarTemaAplicado();
}

let faltandoAgora: string[] = [];

export const ativosFaltando = () => faltandoAgora;

let escudoDe: string | null = null;

function aplicarEscudo() {
  const variante = document.documentElement.dataset.tema ?? "";
  if (escudoDe === variante) return;

  let escudo = document.getElementById(ID_DO_ESCUDO);

  if (!escudo) {
    escudo = document.createElement("style");
    escudo.id = ID_DO_ESCUDO;
  }

  escudo.textContent = cssDoEscudo(medirBase(ID_DO_ESTILO));
  document.head.appendChild(escudo);
  escudoDe = variante;
}

export function revisarEscudo() {
  escudoDe = null;
  aplicarEscudo();
}

let daPonte = new Set<string>();

function aplicarPonte(estado: EstadoDoEstudio) {
  const raiz = document.documentElement;

  for (const nome of daPonte) {
    if (!(nome in estado.substituicoes)) raiz.style.removeProperty(nome);
  }

  daPonte = new Set();

  if (!estado.css.trim()) return;

  const declarados = nomesDeclaradosNoTema(estado.css);

  const lido = getComputedStyle(document.body ?? raiz);
  const origens: Record<string, string> = {};

  for (const nome of NOMES_DE_ORIGEM) {
    if (declarados.has(nome)) origens[nome] = lido.getPropertyValue(nome);
  }

  const escolhidos = new Set(Object.keys(estado.substituicoes));
  const traduzidos = traduzirTema(origens, escolhidos);

  for (const [nome, valor] of Object.entries(
    completarComDerivacao(traduzidos, estado.saturacao),
  )) {
    if (escolhidos.has(nome)) continue;

    raiz.style.setProperty(nome, valor);
    daPonte.add(nome);
  }

}

export const useEstudio = create<EstudioStore>((set, store) => {
  const guardar = (mudanca: Partial<EstadoDoEstudio>) => {
    set(mudanca);

    const { css, biblioteca, ativos, ativoId, coresMae, saturacao, manuais, aRisca, soOQueExisteLa } = store();

    const substituicoes = montarTema(coresMae, saturacao, manuais);
    set({ substituicoes });

    const inteiro = {
      substituicoes,
      coresMae,
      saturacao,
      manuais,
      css,
      biblioteca,
      ativos,
      ativoId,
      aRisca,
      soOQueExisteLa,
    };

    aplicar(inteiro);

    try {
      localStorage.setItem(CHAVE, JSON.stringify(inteiro));
    } catch {
    }

    canal?.postMessage(1);
  };

  return {
    ...ler(),

    definirToken: (nome, valor) => {
      const manuais = { ...store().manuais };
      if (valor === null) delete manuais[nome];
      else manuais[nome] = valor;

      guardar({ manuais });
    },

    definirCorMae: (id, valor) => {
      const coresMae = { ...store().coresMae };
      if (valor === null) delete coresMae[id];
      else coresMae[id] = valor;

      guardar({ coresMae });
    },

    definirSaturacao: (fator) => guardar({ saturacao: fator }),

    definirARisca: (aRisca) => {
      const { ativoId, biblioteca } = store();
      if (!ativoId) return guardar({ aRisca });

      guardar({
        aRisca,
        biblioteca: biblioteca.map((t) => (t.id === ativoId ? { ...t, aRisca } : t)),
      });
    },

    definirSoOQueExisteLa: (ligado) => {
      const { ativoId, biblioteca } = store();
      if (!ativoId) return guardar({ soOQueExisteLa: ligado });

      guardar({
        soOQueExisteLa: ligado,
        biblioteca: biblioteca.map((t) => (t.id === ativoId ? { ...t, soOQueExisteLa: ligado } : t)),
      });
    },

    definirCss: (css) => guardar({ css }),

    salvarNaBiblioteca: (nome) =>
      guardar({
        biblioteca: [
          ...store().biblioteca,
          {
            id: crypto.randomUUID(),
            nome,
            substituicoes: { ...store().substituicoes },
            coresMae: { ...store().coresMae },
            saturacao: store().saturacao,
            manuais: { ...store().manuais },
            css: store().css,
          },
        ],
      }),

    aplicarDaBiblioteca: (id) => {
      const tema = store().biblioteca.find((t) => t.id === id);
      if (!tema) return;

      guardar({ ...doTema(tema), css: tema.css, ativoId: id });
    },

    alternarTema: (id) => {
      const tema = store().biblioteca.find((t) => t.id === id);
      if (!tema) return;

      if (store().ativoId === id) {
        guardar({ ...SEM_TEMA, css: "", ativoId: null });
        return;
      }

      guardar({ ...doTema(tema), css: tema.css, ativoId: id });
    },

    atualizarNaBiblioteca: (id, dados) => {
      const biblioteca = store().biblioteca.map((tema) =>
        tema.id === id ? { ...tema, ...dados } : tema,
      );

      const valendo = store().ativoId === id;
      const atual = biblioteca.find((t) => t.id === id);

      guardar(
        valendo && atual
          ? { biblioteca, ...doTema(atual), css: atual.css }
          : { biblioteca },
      );
    },

    duplicarDaBiblioteca: (id) => {
      const tema = store().biblioteca.find((t) => t.id === id);
      if (!tema) return;

      guardar({
        biblioteca: [
          ...store().biblioteca,
          { ...tema, id: crypto.randomUUID(), nome: `${tema.nome} (cópia)` },
        ],
      });
    },

    importarCssComoTema: (css, nomeDoArquivo) => {
      const cabecalho = lerCabecalhoDoTema(css);
      const id = crypto.randomUUID();

      guardar({
        biblioteca: [
          ...store().biblioteca,
          {
            id,
            nome: cabecalho.nome ?? nomeDoArquivo ?? "Tema sem nome",
            autor: cabecalho.autor,
            versao: cabecalho.versao,
            descricao: cabecalho.descricao,
            tags: cabecalho.tags,
            substituicoes: {},
            css,
          },
        ],
      });

      return id;
    },

    importarBiblioteca: (temas) =>
      guardar({
        biblioteca: [
          ...store().biblioteca,
          ...temas.map((tema) => ({ ...tema, id: crypto.randomUUID() })),
        ],
      }),

    apagarDaBiblioteca: (id) =>
      guardar({
        biblioteca: store().biblioteca.filter((tema) => tema.id !== id),
        ...(store().ativoId === id ? { ...SEM_TEMA, css: "", ativoId: null } : {}),
      }),

    importar: ({ substituicoes, css }) =>
      guardar({
        ...SEM_TEMA,
        manuais: { ...(substituicoes ?? {}) },
        css: css ?? "",
      }),

    guardarAtivo: (ativo) =>
      guardar({ ativos: [...store().ativos, { ...ativo, id: crypto.randomUUID() }] }),

    apagarAtivo: (id) => guardar({ ativos: store().ativos.filter((a) => a.id !== id) }),

    limparSubstituicoes: () => guardar({ ...SEM_TEMA }),

    limparTudo: () =>
      guardar({ ...SEM_TEMA, css: "", biblioteca: [], ativos: [], ativoId: null }),
  };
});

aplicar(useEstudio.getState());

function receber() {
  const chegou = ler();

  useEstudio.setState(chegou);
  aplicar(chegou);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (evento) => {
    if (evento.key === CHAVE) receber();
  });

  if (typeof BroadcastChannel !== "undefined") {
    canal = new BroadcastChannel(CHAVE);
    canal.onmessage = receber;
  }
}
