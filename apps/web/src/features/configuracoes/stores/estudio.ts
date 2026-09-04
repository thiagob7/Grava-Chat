import { create } from "zustand";

export interface TemaSalvo {
  id: string;
  nome: string;
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
}

interface EstudioStore extends EstadoDoEstudio {
  definirToken: (nome: string, valor: string | null) => void;
  definirCss: (css: string) => void;
  salvarNaBiblioteca: (nome: string) => void;
  aplicarDaBiblioteca: (id: string) => void;
  apagarDaBiblioteca: (id: string) => void;
  importar: (tema: { substituicoes?: Record<string, string>; css?: string; nome?: string }) => void;
  guardarAtivo: (ativo: Omit<AtivoDoTema, "id">) => void;
  apagarAtivo: (id: string) => void;
  limparSubstituicoes: () => void;
  limparTudo: () => void;
}

const CHAVE = "gravae:estudio";
const VAZIO: EstadoDoEstudio = { substituicoes: {}, css: "", biblioteca: [], ativos: [] };

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
}

export const useEstudio = create<EstudioStore>((set, store) => {
  const guardar = (mudanca: Partial<EstadoDoEstudio>) => {
    set(mudanca);

    const { substituicoes, css, biblioteca, ativos } = store();
    aplicar({ substituicoes, css, biblioteca, ativos });

    try {
      localStorage.setItem(CHAVE, JSON.stringify({ substituicoes, css, biblioteca, ativos }));
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

      guardar({ substituicoes: { ...tema.substituicoes }, css: tema.css });
    },

    apagarDaBiblioteca: (id) =>
      guardar({ biblioteca: store().biblioteca.filter((tema) => tema.id !== id) }),

    importar: ({ substituicoes, css }) =>
      guardar({ substituicoes: { ...(substituicoes ?? {}) }, css: css ?? "" }),

    guardarAtivo: (ativo) =>
      guardar({ ativos: [...store().ativos, { ...ativo, id: crypto.randomUUID() }] }),

    apagarAtivo: (id) => guardar({ ativos: store().ativos.filter((a) => a.id !== id) }),

    limparSubstituicoes: () => guardar({ substituicoes: {} }),

    limparTudo: () => guardar({ substituicoes: {}, css: "", biblioteca: [], ativos: [] }),
  };
});

aplicar(useEstudio.getState());
