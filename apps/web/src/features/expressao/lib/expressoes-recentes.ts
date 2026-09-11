const KEY_STICKERS = "gravae:figurinhas-recentes";
const COUNT = 12;

export function recentStickers(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY_STICKERS) ?? "[]") as unknown;
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function registerSticker(id: string) {
  try {
    const current = recentStickers().filter((s) => s !== id);
    localStorage.setItem(KEY_STICKERS, JSON.stringify([id, ...current].slice(0, COUNT)));
  } catch {
  }
}
