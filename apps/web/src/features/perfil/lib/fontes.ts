import type { NameFont } from "@gravae/shared";

export const FONT_FAMILY: Record<NameFont, string> = {
  padrao: "var(--font-sans)",
  serifada: '"Lora", ui-serif, Georgia, serif',
  monoespacada: '"JetBrains Mono", ui-monospace, "SF Mono", monospace',
  titulo: '"Bebas Neue", "Impact", var(--font-sans)',
  manuscrita: '"Caveat", "Brush Script MT", cursive',
};

export function fontFamily(
  font: NameFont | null | undefined,
): string | null {
  if (!font || font === "padrao") return null;

  return FONT_FAMILY[font] ?? null;
}

const LOADERS: Record<
  Exclude<NameFont, "padrao">,
  () => Promise<unknown>
> = {
  serifada: () => import("@fontsource/lora/400.css"),
  monoespacada: () => import("@fontsource/jetbrains-mono/400.css"),
  titulo: () => import("@fontsource/bebas-neue/400.css"),
  manuscrita: () => import("@fontsource/caveat/400.css"),
};

const loaded = new Set<string>();

export function loadFont(font: NameFont | null | undefined): void {
  if (!font || font === "padrao" || loaded.has(font)) return;

  loaded.add(font);
  void LOADERS[font]?.().catch(() => loaded.delete(font));
}

export const loadAllFonts = () =>
  (Object.keys(LOADERS) as (keyof typeof LOADERS)[]).forEach(
    loadFont,
  );
