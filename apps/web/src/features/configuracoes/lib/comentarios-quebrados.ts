const QUEBRA = /\*\/\*(?:(?!\*\/)[\s\S])*\*\//g;

export interface Engolida {
  variavel: string | null;
  linha: number;
}

export function acharComentariosQuebrados(css: string): Engolida[] {
  const achados: Engolida[] = [];

  for (const quebra of css.matchAll(QUEBRA)) {
    const inicio = quebra.index ?? 0;

    const seguinte = /\s*(--[A-Za-z0-9_-]+)\s*:/.exec(css.slice(inicio + quebra[0].length));

    achados.push({
      variavel: seguinte?.[1] ?? null,
      linha: css.slice(0, inicio).split("\n").length,
    });
  }

  return achados;
}

export function consertarComentariosQuebrados(css: string): string {
  return css.replace(QUEBRA, "*/");
}
