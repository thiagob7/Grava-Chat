const TRAVADO = /\.([A-Za-z][A-Za-z0-9]*)\\\.module__([A-Za-z0-9]+)___[A-Za-z0-9]+/g;

const DIV_NA_FRENTE = /\bdiv(?=\[class\*=)/g;

export function traduzirSeletoresTravados(css: string): string {
  return css
    .replace(
      TRAVADO,
      (_, arquivo: string, parte: string) => `[class*="${arquivo}.module__${parte}_"]`,
    )
    .replace(DIV_NA_FRENTE, "");
}

const QUASE_SO_HASH = 0.7;

export function deveTraduzir(css: string): boolean {
  const { presos, soltos } = contarSeletoresDatados(css);
  const total = presos + soltos;

  return total > 0 && presos / total >= QUASE_SO_HASH;
}

export function contarSeletoresDatados(css: string): {
  presos: number;
  comDiv: number;
  soltos: number;
} {
  return {
    presos: new Set(css.match(TRAVADO) ?? []).size,
    comDiv: new Set(css.match(/\bdiv\[class\*="[^"]+"\]/g) ?? []).size,
    soltos: new Set(css.match(/\[class\*="[^"]+"\]/g) ?? []).size,
  };
}

export const CLASSE_DO_TEMA: Record<string, string> = {
  escuro: "theme-dark",
  "mais-escuro": "theme-coal",
  claro: "theme-light",
  gravae: "theme-dark",
};

export function marcarTemaDaRaiz(tema: string | undefined) {
  const raiz = document.documentElement;

  for (const classe of Object.values(CLASSE_DO_TEMA)) raiz.classList.remove(classe);

  const escolhida = CLASSE_DO_TEMA[tema ?? ""] ?? CLASSE_DO_TEMA.escuro;
  if (escolhida) raiz.classList.add(escolhida);
}

export interface ExisteNaReferencia {
  modulos: string[];
  areas: string[];
}

export function filtrarRegrasMortas(css: string, existe: ExisteNaReferencia): string {
  const modulos = new Set(existe.modulos);
  const areas = new Set(existe.areas);

  const viva = (seletor: string) => {
    const limpo = seletor.replace(/\\/g, "");
    const nomes: string[] = [];

    for (const [, modulo] of limpo.matchAll(/([A-Za-z][A-Za-z0-9]*)\.module__/g)) nomes.push(`m:${modulo}`);
    for (const [, modulo] of limpo.matchAll(/\[class\*="([A-Za-z][A-Za-z0-9]*)"\]\s*\[class\*="[A-Za-z][A-Za-z0-9]*"\]/g)) nomes.push(`m:${modulo}`);
    for (const [, caminho] of limpo.matchAll(/data-flx\s*=\s*["']([^"']+)["']/g)) nomes.push(`a:${(caminho ?? "").split(".").slice(0, 2).join(".")}`);

    if (!nomes.length) return true;
    return nomes.some((n) => (n.startsWith("m:") ? modulos.has(n.slice(2)) : areas.has(n.slice(2))));
  };

  let saida = "";
  let i = 0;

  while (i < css.length) {
    const abre = css.indexOf("{", i);
    if (abre === -1) {
      saida += css.slice(i);
      break;
    }

    const seletor = css.slice(i, abre);

    const cabecalho = /@([a-z-]+)[^{}]*$/.exec(seletor);
    if (cabecalho) {
      if (cabecalho[1] === "keyframes" || cabecalho[1] === "font-face" || cabecalho[1] === "property") {
        let fundo = 0;
        let fim = abre;
        for (; fim < css.length; fim++) {
          if (css[fim] === "{") fundo++;
          else if (css[fim] === "}" && --fundo === 0) break;
        }
        saida += css.slice(i, fim + 1);
        i = fim + 1;
        continue;
      }

      saida += css.slice(i, abre + 1);
      i = abre + 1;
      continue;
    }

    if (seletor.includes("}")) {
      const k = seletor.lastIndexOf("}");
      saida += seletor.slice(0, k + 1);
      i += k + 1;
      continue;
    }

    let fundo = 0;
    let fim = abre;
    for (; fim < css.length; fim++) {
      if (css[fim] === "{") fundo++;
      else if (css[fim] === "}" && --fundo === 0) break;
    }

    const corpo = css.slice(abre, fim + 1);
    saida += viva(seletor) ? seletor + corpo : seletor.replace(/[^\n]/g, "");
    i = fim + 1;
  }

  return saida;
}

export function contarRegrasMortas(css: string, existe: ExisteNaReferencia): number {
  const conta = (texto: string) => (texto.match(/\{[^{}]*:[^{}]*\}/g) ?? []).length;
  return Math.max(0, conta(css) - conta(filtrarRegrasMortas(css, existe)));
}
