import Color from "color";

import map from "~/features/configuracoes/lib/cores-mae.json";

export interface ColorChild {
  name: string;
  dL: number;
  reasonC: number;
  dH: number;
  alfa: number | null;
  mirrors?: boolean;
  contrast?: boolean;
  anchor?: boolean;
  L?: number;
}

export interface ColorFamily {
  label: string;
  hint: string;
  base: string;
  fallback: string;
  children: ColorChild[];
}

export const COLORS_BASE = map as Record<string, ColorFamily>;

export const BASE = Object.keys(COLORS_BASE);

const CHROMA_FLOOR = 3;
const CHROMA_CEILING = 132;

const MEIO = 50;

type Color = ReturnType<typeof Color>;

const between = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

function write(color: Color, alfa: number | null): string {
  if (alfa === null) return color.hex().toLowerCase();

  const [r = 0, g = 0, b = 0] = color.rgb().array().map(Math.round);
  return `rgb(${r} ${g} ${b} / ${alfa})`;
}

function scale(dL: number, inverts: boolean, baseL: number, defaultL: number) {
  const target = inverts ? -dL : dL;
  const spaceNew = target > 0 ? 100 - baseL : baseL;
  const spaceBase = dL > 0 ? 100 - defaultL : defaultL;

  return baseL + target * (spaceNew / Math.max(spaceBase, 1));
}

export function derive(
  id: string,
  picked: string,
  factor = 1,
): Record<string, string> {
  const family = COLORS_BASE[id];
  if (!family) return {};

  let base: Color;
  try {
    base = Color(picked);
  } catch {
    return {};
  }

  const [baseL = 0, baseC = 0, baseH = 0] = base.lch().array();
  const [defaultL = 0] = Color(family.fallback).lch().array();

  const turned = baseL > MEIO !== defaultL > MEIO;

  const output: Record<string, string> = {
    [family.base]: write(
      Color.lch(baseL, between(baseC * factor, 0, CHROMA_CEILING), baseH),
      base.alpha() < 1 ? Number(base.alpha().toFixed(4)) : null,
    ),
  };

  for (const child of family.children) {
    const inverts =
      !child.anchor &&
      (Boolean(child.mirrors) || Boolean(child.contrast)) &&
      turned;

    const L =
      child.L === undefined
        ? scale(child.dL, inverts, baseL, defaultL)
        : inverts
          ? 100 - child.L
          : child.L;

    const C = Math.max(baseC, CHROMA_FLOOR) * child.reasonC * factor;
    const H = (((baseH + child.dH) % 360) + 360) % 360;

    output[child.name] = write(
      Color.lch(between(L, 0, 100), between(C, 0, CHROMA_CEILING), H),
      child.alfa,
    );
  }

  return output;
}

export const TOKENS_DERIVED = new Set(
  Object.values(COLORS_BASE).flatMap((f) => [
    f.base,
    ...f.children.map((c) => c.name),
  ]),
);

export function buildTheme(
  colorsBase: Record<string, string>,
  saturation: number,
  manual: Record<string, string>,
): Record<string, string> {
  const derived: Record<string, string> = {};

  for (const [id, color] of Object.entries(colorsBase)) {
    Object.assign(derived, derive(id, color, saturation));
  }

  return { ...derived, ...manual };
}

export function completeWithDerivation(
  translated: Record<string, string>,
  saturation = 1,
): Record<string, string> {
  const output: Record<string, string> = {};

  for (const id of BASE) {
    const family = COLORS_BASE[id];
    const color = family && translated[family.base];
    if (!color) continue;

    for (const [name, value] of Object.entries(derive(id, color, saturation))) {
      if (name in translated) continue;
      output[name] = value;
    }
  }

  return output;
}
