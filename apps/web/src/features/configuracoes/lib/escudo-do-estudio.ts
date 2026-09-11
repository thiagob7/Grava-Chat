import live from "~/features/configuracoes/lib/tokens-vivos.json";

const NAMES = live as string[];

export const SHIELD_CLASS = "janela-neutra";

export const SHIELD_ID = "gc-escudo-estudio";

export function measureBase(leafThemeId: string): Record<string, string> {
  if (typeof document === "undefined") return {};

  const root = document.documentElement;
  const inLine = root.getAttribute("style");
  const leaf = document.getElementById(
    leafThemeId,
  ) as HTMLStyleElement | null;

  root.removeAttribute("style");
  if (leaf) leaf.disabled = true;

  const read = getComputedStyle(root);
  const base: Record<string, string> = {};

  for (const name of NAMES) {
    const value = read.getPropertyValue(name).trim();
    if (value) base[name] = value;
  }

  if (leaf) leaf.disabled = false;
  if (inLine !== null) root.setAttribute("style", inLine);

  return base;
}

export function shieldCss(base: Record<string, string>): string {
  const lines = Object.entries(base)
    .map(([name, value]) => `  ${name}: ${value} !important;`)
    .join("\n");

  return `.${SHIELD_CLASS} {\n${lines}\n}\n
.${SHIELD_CLASS},
.${SHIELD_CLASS} * {
  backdrop-filter: none !important;
}
`;
}
