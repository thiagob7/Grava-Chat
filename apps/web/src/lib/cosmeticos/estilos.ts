import type { CSSProperties } from "react";

import { VAZIOS } from "./catalogo";

export type EstiloCss = CSSProperties & Record<`--${string}`, string | number | undefined>;

export const PARADO = "0s";

/*
  Molduras que passam pra FORA do retângulo do cartão.

  As de gradiente são efeito de beirada: vivem sobre o cartão e herdam o
  arredondamento dele. As desenhadas são ornamento, e ornamento colado por
  dentro come o banner. Estas ganham uma faixa de 12px em volta — a folga sai
  do popover, que cresce com o cartão, e não do conteúdo, que fica intacto.
*/
const TRANSBORDAM = new Set(["rosas"]);

export const molduraTransborda = (id: string | null | undefined): boolean =>
  Boolean(id && TRANSBORDAM.has(id));

export function classeDoEnfeite(familia: string, id: string | null | undefined): string | null {
  if (!id || VAZIOS.has(id)) return null;

  return `gc-${familia}--${id}`;
}

interface Variaveis {
  cor1?: string | null;
  cor2?: string | null;
  fonte?: string | null;
  animar?: boolean;
  velocidade?: string;
}

export function variaveisDoEnfeite(v: Variaveis): EstiloCss | undefined {
  const estilo: EstiloCss = {};

  if (v.cor1) estilo["--gc-cor-1"] = v.cor1;
  if (v.cor2) estilo["--gc-cor-2"] = v.cor2;
  if (v.fonte) estilo["--gc-fonte"] = v.fonte;

  if (v.animar) estilo["--gc-vel"] = v.velocidade ?? "4s";

  return Object.keys(estilo).length > 0 ? estilo : undefined;
}
