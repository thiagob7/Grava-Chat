import { create } from "zustand";

import {
  CURSOR_ROLES,
  asRule,
  type CursorImported,
  type CursorRole,
} from "~/features/configuracoes/lib/cursor-importado";

const KEY = "gravae:cursores";

export type SetCursors = Partial<Record<CursorRole, CursorImported>>;

interface CursorsStore {
  cursors: SetCursors;
  set: (role: CursorRole, cursor: CursorImported | null) => void;
  applyPacket: (cursors: SetCursors) => void;
  clear: () => void;
}

function read(): SetCursors {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? (JSON.parse(saved) as SetCursors) : {};
  } catch {
    return {};
  }
}

function keep(cursors: SetCursors) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cursors));
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
export function applyCursors(cursors: SetCursors) {
  const root = document.documentElement;

  for (const role of CURSOR_ROLES) {
    const rule = asRule(cursors[role] ?? null, role);

    if (rule) root.style.setProperty(`--cursor-${role}`, rule);
    else root.style.removeProperty(`--cursor-${role}`);
  }
}

export const useCursors = create<CursorsStore>((set, store) => ({
  cursors: read(),

  set: (role, cursor) => {
    const cursors = { ...store().cursors };

    if (cursor) cursors[role] = cursor;
    else delete cursors[role];

    set({ cursors });
    keep(cursors);
    applyCursors(cursors);
  },

  applyPacket: (cursors) => {
    const packet = { ...cursors };

    set({ cursors: packet });
    keep(packet);
    applyCursors(packet);
  },

  clear: () => {
    set({ cursors: {} });
    keep({});
    applyCursors({});
  },
}));
