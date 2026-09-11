import type { NameEffect, NameStyle } from "@gravae/shared";

import { readable } from "./contraste";
import { charmVariables, type StyleCss } from "./estilos";
import { fontFamily } from "./fontes";

export interface Charm {
  className?: string;
  style?: StyleCss;
}

const CROP_TEXT = new Set<NameEffect>(["gradiente", "brilho"]);

export interface NameEntry {
  style?: NameStyle | null;
  roleColor?: string | null;
  size?: "sm" | "md";
  animate?: boolean;
  background?: string;
}

export function nameStyle({
  style,
  roleColor,
  size = "sm",
  animate = false,
  background,
}: NameEntry): Charm {
  const request = style?.effect ?? "solido";
  const demoted = CROP_TEXT.has(request) && size === "sm";
  const effect = demoted ? "solido" : request;

  const userColor = style?.color ?? null;
  const font = fontFamily(style?.font);
  const classes: string[] = [];

  if (font) classes.push("gc-fonte");

  if (effect === "solido") {
    const color = demoted ? (userColor ?? roleColor) : (roleColor ?? userColor);

    const style: StyleCss = {
      ...(color ? { color: readable(color, background) } : null),
      ...charmVariables({ font }),
    };

    return {
      className: classes.join(" ") || undefined,
      style: Object.keys(style).length > 0 ? style : undefined,
    };
  }

  classes.push(`gc-nome--${effect}`);

  return {
    className: classes.join(" "),
    style: charmVariables({
      color1: readableOuNothing(userColor ?? roleColor, background),
      color2: readableOuNothing(style?.color2, background),
      font,
      animate,
    }),
  };
}

const readableOuNothing = (color: string | null | undefined, background?: string) =>
  color ? readable(color, background) : null;
