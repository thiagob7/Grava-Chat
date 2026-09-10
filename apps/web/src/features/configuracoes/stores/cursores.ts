import { create } from "zustand";

import {
  PAPEIS_DE_CURSOR,
  comoRegra,
  type CursorImportado,
  type PapelDeCursor,
} from "~/features/configuracoes/lib/cursor-importado";

const CHAVE = "gravae:cursores";

export type ConjuntoDeCursores = Partial<Record<PapelDeCursor, CursorImportado>>;

interface StoreDeCursores {
  cursores: ConjuntoDeCursores;
  definir: (papel: PapelDeCursor, cursor: CursorImportado | null) => void;
  aplicarPacote: (cursores: ConjuntoDeCursores) => void;
  limpar: () => void;
}

function ler(): ConjuntoDeCursores {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo ? (JSON.parse(salvo) as ConjuntoDeCursores) : {};
  } catch {
    return {};
  }
}

function guardar(cursores: ConjuntoDeCursores) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(cursores));
  } catch {
    /*
      A imagem vai embutida, então o armazenamento pode encher. Perder o que a
      pessoa acabou de escolher é ruim, mas quebrar o app inteiro por causa de
      um cursor seria pior.
    */
  }
}

/*
  Cada papel vira uma variável em `:root`, e o CSS do app consome essas
  variáveis. Fazer assim, em vez de injetar regra de cursor para cada seletor,
  significa que uma folha de estilo só é escrita uma vez e nunca cresce.
*/
export function aplicarCursores(cursores: ConjuntoDeCursores) {
  const raiz = document.documentElement;

  for (const papel of PAPEIS_DE_CURSOR) {
    const regra = comoRegra(cursores[papel] ?? null, papel);

    if (regra) raiz.style.setProperty(`--cursor-${papel}`, regra);
    else raiz.style.removeProperty(`--cursor-${papel}`);
  }
}

export const useCursores = create<StoreDeCursores>((set, store) => ({
  cursores: ler(),

  definir: (papel, cursor) => {
    const cursores = { ...store().cursores };

    if (cursor) cursores[papel] = cursor;
    else delete cursores[papel];

    set({ cursores });
    guardar(cursores);
    aplicarCursores(cursores);
  },

  aplicarPacote: (cursores) => {
    const conjunto = { ...cursores };

    set({ cursores: conjunto });
    guardar(conjunto);
    aplicarCursores(conjunto);
  },

  limpar: () => {
    set({ cursores: {} });
    guardar({});
    aplicarCursores({});
  },
}));
