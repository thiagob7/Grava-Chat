import type { CSSProperties } from "react";

import { VAZIOS } from "./catalogo";

export type EstiloCss = CSSProperties & Record<`--${string}`, string | number | undefined>;

export const PARADO = "0s";

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
