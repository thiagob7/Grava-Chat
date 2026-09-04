const CHAVE_FIGURINHAS = "gravae:figurinhas-recentes";
const QUANTAS = 12;

export function figurinhasRecentes(): string[] {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_FIGURINHAS) ?? "[]") as unknown;
    return Array.isArray(salvo) ? salvo.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function registrarFigurinha(id: string) {
  try {
    const atual = figurinhasRecentes().filter((s) => s !== id);
    localStorage.setItem(CHAVE_FIGURINHAS, JSON.stringify([id, ...atual].slice(0, QUANTAS)));
  } catch {
    /* modo privado: a lista vale só nesta aba */
  }
}
