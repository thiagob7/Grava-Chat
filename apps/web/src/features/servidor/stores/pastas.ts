import { create } from "zustand";

import {
  toggleFolder,
  undoFolder,
  editFolder,
  moveServer,
  type Layout,
  type Destination,
} from "~/features/servidor/lib/trilho";

interface FoldersStore {
  layout: Layout;
  move: (guildIds: string[], guildId: string, destination: Destination) => void;
  toggle: (folderId: string) => void;
  edit: (folderId: string, data: Parameters<typeof editFolder>[2]) => void;
  undo: (folderId: string) => void;
}

const KEY = "gravae:trilho";

function read(): Layout {
  try {
    const saved = localStorage.getItem(KEY);
    const read = saved ? (JSON.parse(saved) as Partial<Layout>) : null;
    return { order: read?.order ?? [], folders: read?.folders ?? [] };
  } catch {
    return { order: [], folders: [] };
  }
}

function keep(layout: Layout) {
  try {
    localStorage.setItem(KEY, JSON.stringify(layout));
  } catch {
  }
}

export const useFolders = create<FoldersStore>((set, store) => {
  const apply = (layout: Layout) => {
    set({ layout });
    keep(layout);
  };

  return {
    layout: read(),
    move: (guildIds, guildId, destination) => apply(moveServer(guildIds, store().layout, guildId, destination)),
    toggle: (folderId) => apply(toggleFolder(store().layout, folderId)),
    edit: (folderId, data) => apply(editFolder(store().layout, folderId, data)),
    undo: (folderId) => apply(undoFolder(store().layout, folderId)),
  };
});
