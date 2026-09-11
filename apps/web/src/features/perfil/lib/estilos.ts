import type { CSSProperties } from "react";

import { FAMILIES_OFF, EMPTY } from "./catalogo";

export type StyleCss = CSSProperties & Record<`--${string}`, string | number | undefined>;

export const PARADO = "0s";

export function charmClass(family: string, id: string | null | undefined): string | null {
  if (!id || EMPTY.has(id) || FAMILIES_OFF.has(family)) return null;

  return `gc-${family}--${id}`;
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
