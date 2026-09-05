import { create } from "zustand";

import { lerCabecalhoDoTema } from "@gravae/shared";

import { NOMES_DE_ORIGEM, traduzirTema } from "~/features/configuracoes/lib/ponte-de-tema";

export interface TemaSalvo {
  id: string;
  nome: string;
  /// Saem do cabeçalho do CSS quando o tema vem de um arquivo.
  autor?: string | null;
  versao?: string | null;
  descricao?: string | null;
  tags?: string[];
  substituicoes: Record<string, string>;
  css: string;
}

export interface AtivoDoTema {
  id: string;
  nome: string;
  url: string;
  tipo: string;
}

interface EstadoDoEstudio {
  substituicoes: Record<string, string>;
  css: string;
  biblioteca: TemaSalvo[];
  ativos: AtivoDoTema[];
  /// Qual tema da biblioteca está valendo agora. Null é o tema base.
  ativoId: string | null;
}

interface EstudioStore extends EstadoDoEstudio {
  definirToken: (nome: string, valor: string | null) => void;
  definirCss: (css: string) => void;
  salvarNaBiblioteca: (nome: string) => void;
  aplicarDaBiblioteca: (id: string) => void;
  apagarDaBiblioteca: (id: string) => void;
  importar: (tema: { substituicoes?: Record<string, string>; css?: string; nome?: string }) => void;
  importarCssComoTema: (css: string, nomeDoArquivo?: string) => string;
  atualizarNaBiblioteca: (id: string, dados: Partial<Omit<TemaSalvo, "id">>) => void;
  duplicarDaBiblioteca: (id: string) => void;
  alternarTema: (id: string) => void;
  importarBiblioteca: (temas: TemaSalvo[]) => void;
  guardarAtivo: (ativo: Omit<AtivoDoTema, "id">) => void;
  apagarAtivo: (id: string) => void;
  limparSubstituicoes: () => void;
  limparTudo: () => void;
}

const CHAVE = "gravae:estudio";
const VAZIO: EstadoDoEstudio = {
  substituicoes: {},
  css: "",
  biblioteca: [],
  ativos: [],
  ativoId: null,
};

function ler(): EstadoDoEstudio {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo ? { ...VAZIO, ...(JSON.parse(salvo) as Partial<EstadoDoEstudio>) } : VAZIO;
  } catch {
    return VAZIO;
  }
}

const ID_DO_ESTILO = "gc-estudio-css";

let escritos = new Set<string>();

function aplicar(estado: EstadoDoEstudio) {
  const raiz = document.documentElement;

  for (const nome of escritos) {
    if (!(nome in estado.substituicoes)) raiz.style.removeProperty(nome);
  }

  escritos = new Set(Object.keys(estado.substituicoes));

  for (const [nome, valor] of Object.entries(estado.substituicoes)) {
    raiz.style.setProperty(nome, valor);
  }

  let estilo = document.getElementById(ID_DO_ESTILO);
  if (!estilo) {
    estilo = document.createElement("style");
    estilo.id = ID_DO_ESTILO;
    document.head.appendChild(estilo);
  }

  estilo.textContent = estado.css;

  aplicarPonte(estado);
}

/// O que a ponte escreveu da última vez, para limpar quando o tema sair.
let daPonte = new Set<string>();

/*
  Depois que a folha do tema entra, lemos as variáveis que ELE declarou e
  escrevemos nos nossos nomes. Precisa ser depois: só com a folha aplicada o
  getComputedStyle enxerga o que ela definiu.
*/
function aplicarPonte(estado: EstadoDoEstudio) {
  const raiz = document.documentElement;

  for (const nome of daPonte) {
    if (!(nome in estado.substituicoes)) raiz.style.removeProperty(nome);
  }

  daPonte = new Set();

  if (!estado.css.trim()) return;

  const lido = getComputedStyle(raiz);
  const origens: Record<string, string> = {};

  for (const nome of NOMES_DE_ORIGEM) {
    origens[nome] = lido.getPropertyValue(nome);
  }

  const escolhidos = new Set(Object.keys(estado.substituicoes));

  for (const [nome, valor] of Object.entries(traduzirTema(origens, escolhidos))) {
    raiz.style.setProperty(nome, valor);
    daPonte.add(nome);
  }
}

export const useEstudio = create<EstudioStore>((set, store) => {
  const guardar = (mudanca: Partial<EstadoDoEstudio>) => {
    set(mudanca);

    const { substituicoes, css, biblioteca, ativos, ativoId } = store();
    aplicar({ substituicoes, css, biblioteca, ativos, ativoId });

    try {
      localStorage.setItem(
        CHAVE,
        JSON.stringify({ substituicoes, css, biblioteca, ativos, ativoId }),
      );
    } catch {
      /// Sem localStorage o estúdio ainda funciona; só não sobrevive ao F5.
    }
  };

  return {
    ...ler(),

    definirToken: (nome, valor) => {
      const substituicoes = { ...store().substituicoes };
      if (valor === null) delete substituicoes[nome];
      else substituicoes[nome] = valor;

      guardar({ substituicoes });
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
            css: store().css,
          },
        ],
      }),

    aplicarDaBiblioteca: (id) => {
      const tema = store().biblioteca.find((t) => t.id === id);
      if (!tema) return;

      guardar({ substituicoes: { ...tema.substituicoes }, css: tema.css, ativoId: id });
    },

    /// Ligar troca o tema que está valendo; desligar volta para o base.
    alternarTema: (id) => {
      const tema = store().biblioteca.find((t) => t.id === id);
      if (!tema) return;

      if (store().ativoId === id) {
        guardar({ substituicoes: {}, css: "", ativoId: null });
        return;
      }

      guardar({ substituicoes: { ...tema.substituicoes }, css: tema.css, ativoId: id });
    },

    atualizarNaBiblioteca: (id, dados) => {
      const biblioteca = store().biblioteca.map((tema) =>
        tema.id === id ? { ...tema, ...dados } : tema,
      );

      /// Editar o tema que está no ar precisa repintar na hora, senão a
      /// pessoa salva e não vê nada acontecer.
      const valendo = store().ativoId === id;
      const atual = biblioteca.find((t) => t.id === id);

      guardar(
        valendo && atual
          ? { biblioteca, substituicoes: { ...atual.substituicoes }, css: atual.css }
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
        ...(store().ativoId === id ? { substituicoes: {}, css: "", ativoId: null } : {}),
      }),

    importar: ({ substituicoes, css }) =>
      guardar({ substituicoes: { ...(substituicoes ?? {}) }, css: css ?? "" }),

    guardarAtivo: (ativo) =>
      guardar({ ativos: [...store().ativos, { ...ativo, id: crypto.randomUUID() }] }),

    apagarAtivo: (id) => guardar({ ativos: store().ativos.filter((a) => a.id !== id) }),

    limparSubstituicoes: () => guardar({ substituicoes: {} }),

    limparTudo: () =>
      guardar({ substituicoes: {}, css: "", biblioteca: [], ativos: [], ativoId: null }),
  };
});

aplicar(useEstudio.getState());
