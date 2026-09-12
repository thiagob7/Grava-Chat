import type { CSSProperties } from "react";

import { FAMILIES_OFF, EMPTY } from "./catalogo";

export type StyleCss = CSSProperties & Record<`--${string}`, string | number | undefined>;

export const PARADO = "0s";

export function charmClass(family: string, id: string | null | undefined): string | null {
  if (!id || EMPTY.has(id) || FAMILIES_OFF.has(family)) return null;

  return `gc-${family}--${id}`;
}

/*
  A faixa do cartão abre um buraco redondo embaixo, onde a foto senta.

  Isto era uma `<mask>` de SVG e não funcionava: o `100%` do `<rect>` media
  contra o `<svg>` que guardava a máscara, e esse svg tem tamanho zero. A
  máscara saía vazia, apagava a faixa inteira, e no lugar dela aparecia o fundo
  do cartão — a faixa preta. Aqui a conta é do próprio elemento mascarado.

  O meio-pixel entre o transparente e o opaco é só para a borda do buraco não
  sair serrada.
*/
export function trackNotch(cx: number, radius: number): StyleCss {
  const hole = `radial-gradient(circle ${radius}px at ${cx}px 100%, transparent ${radius - 0.5}px, #000 ${radius}px)`;

  return { maskImage: hole, WebkitMaskImage: hole };
}

interface Variables {
  color1?: string | null;
  color2?: string | null;
  font?: string | null;
  animate?: boolean;
  speed?: string;
}

export function charmVariables(v: Variables): StyleCss | undefined {
  const style: StyleCss = {};

  if (v.color1) style["--gc-cor-1"] = v.color1;
  if (v.color2) style["--gc-cor-2"] = v.color2;
  if (v.font) style["--gc-fonte"] = v.font;

  if (v.animate) style["--gc-vel"] = v.speed ?? "4s";

  return Object.keys(style).length > 0 ? style : undefined;
}
