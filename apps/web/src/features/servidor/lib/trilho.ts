export const FOLDER_ICONS = ["pasta", "estrela", "coracao", "salvar", "jogo", "escudo", "nota"] as const;
export type FolderIcon = (typeof FOLDER_ICONS)[number];

export interface FolderBox {
  id: string;
  name: string;
  color: string | null;
  guildIds: string[];
  isOpen: boolean;
  icon?: FolderIcon;
  showIconMinimized?: boolean;
}

export interface Layout {
  order: string[];
  folders: FolderBox[];
}

export type RailItem<G> =
  | { kind: "servidor"; guild: G }
  | { kind: "pasta"; folder: FolderBox; guilds: G[] };

const brand = (folderId: string) => `pasta:${folderId}`;

export function buildRail<G extends { id: string }>(
  guilds: G[],
  layout: Layout,
): RailItem<G>[] {
  const byId = new Map(guilds.map((g) => [g.id, g]));
  const used = new Set<string>();
  const items: RailItem<G>[] = [];

  for (const entry of layout.order) {
    if (entry.startsWith("pasta:")) {
      const folder = layout.folders.find((p) => brand(p.id) === entry);
      if (!folder) continue;

      const inside = folder.guildIds.map((id) => byId.get(id)).filter((g): g is G => Boolean(g));
      inside.forEach((g) => used.add(g.id));
      if (inside.length) items.push({ kind: "pasta", folder, guilds: inside });
      continue;
    }

    const guild = byId.get(entry);
    if (guild && !used.has(guild.id)) {
      used.add(guild.id);
      items.push({ kind: "servidor", guild });
    }
  }

  for (const guild of guilds) {
    if (!used.has(guild.id)) items.push({ kind: "servidor", guild });
  }

  return items;
}

function complete(guildIds: string[], a: Layout): Layout {
  const inFolders = new Set(a.folders.flatMap((p) => p.guildIds));
  const inOrder = new Set(a.order);
  const order = [
    ...a.order.filter((e) => e.startsWith("pasta:") ? a.folders.some((p) => brand(p.id) === e) : guildIds.includes(e) && !inFolders.has(e)),
    ...guildIds.filter((id) => !inOrder.has(id) && !inFolders.has(id)),
  ];

  return { order, folders: a.folders.map((p) => ({ ...p, guildIds: p.guildIds.filter((id) => guildIds.includes(id)) })).filter((p) => p.guildIds.length) };
}

function withoutServer(a: Layout, guildId: string): Layout {
  return {
    order: a.order.filter((e) => e !== guildId),
    folders: a.folders
      .map((p) => ({ ...p, guildIds: p.guildIds.filter((id) => id !== guildId) }))
      .filter((p) => p.guildIds.length),
  };
}

function undoFolders(a: Layout): Layout {
  const alone = a.folders.filter((p) => p.guildIds.length === 1);
  if (!alone.length) return a;

  return {
    order: a.order.map((e) => alone.find((p) => brand(p.id) === e)?.guildIds[0] ?? e),
    folders: a.folders.filter((p) => p.guildIds.length > 1),
  };
}

export type Destination =
  | { kind: "antes"; de: string }
  | { kind: "depois"; de: string }
  | { kind: "juntar"; having: string }
  | { kind: "pasta"; folderId: string }
  | { kind: "fim" };

let counter = 0;
const newId = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

export function moveServer(guildIds: string[], current: Layout, guildId: string, destination: Destination): Layout {
  const base = withoutServer(complete(guildIds, current), guildId);

  if (destination.kind === "fim") return undoFolders({ ...base, order: [...base.order, guildId] });

  if (destination.kind === "pasta") {
    return undoFolders({
      ...base,
      folders: base.folders.map((p) => (p.id === destination.folderId ? { ...p, guildIds: [...p.guildIds, guildId] } : p)),
    });
  }

  if (destination.kind === "juntar") {
    if (destination.having === guildId) return current;
    const folder: FolderBox = { id: newId(), name: "", color: null, guildIds: [destination.having, guildId], isOpen: true, icon: "pasta" };
    const withoutOther = withoutServer(base, destination.having);
    const where = base.order.indexOf(destination.having);
    const order = [...withoutOther.order];
    order.splice(where < 0 ? order.length : where, 0, brand(folder.id));
    return undoFolders({ order, folders: [...withoutOther.folders, folder] });
  }

  const target = destination.de;
  const order = [...base.order];
  const where = order.indexOf(target);
  if (where < 0) return undoFolders({ ...base, order: [...order, guildId] });

  order.splice(destination.kind === "antes" ? where : where + 1, 0, guildId);
  return undoFolders({ ...base, order });
}

export function toggleFolder(a: Layout, folderId: string): Layout {
  return { ...a, folders: a.folders.map((p) => (p.id === folderId ? { ...p, isOpen: !p.isOpen } : p)) };
}

export function editFolder(
  a: Layout,
  folderId: string,
  data: Partial<Pick<FolderBox, "name" | "color" | "icon" | "showIconMinimized">>,
): Layout {
  return { ...a, folders: a.folders.map((p) => (p.id === folderId ? { ...p, ...data } : p)) };
}

export function undoFolder(a: Layout, folderId: string): Layout {
  const folder = a.folders.find((p) => p.id === folderId);
  if (!folder) return a;

  return {
    order: a.order.flatMap((e) => (e === brand(folderId) ? folder.guildIds : [e])),
    folders: a.folders.filter((p) => p.id !== folderId),
  };
}
