import type { FonteDeNome } from "@gravae/shared";

export const FAMILIA_DE_FONTE: Record<FonteDeNome, string> = {
  padrao: "var(--font-sans)",
  serifada: '"Lora", ui-serif, Georgia, serif',
  monoespacada: '"JetBrains Mono", ui-monospace, "SF Mono", monospace',
  titulo: '"Bebas Neue", "Impact", var(--font-sans)',
  manuscrita: '"Caveat", "Brush Script MT", cursive',
};

export function familiaDaFonte(
  fonte: FonteDeNome | null | undefined,
): string | null {
  if (!fonte || fonte === "padrao") return null;

  return FAMILIA_DE_FONTE[fonte] ?? null;
}

const CARREGADORES: Record<
  Exclude<FonteDeNome, "padrao">,
  () => Promise<unknown>
> = {
  serifada: () => import("@fontsource/lora/400.css"),
  monoespacada: () => import("@fontsource/jetbrains-mono/400.css"),
  titulo: () => import("@fontsource/bebas-neue/400.css"),
  manuscrita: () => import("@fontsource/caveat/400.css"),
};

const carregadas = new Set<string>();

export function carregarFonte(fonte: FonteDeNome | null | undefined): void {
  if (!fonte || fonte === "padrao" || carregadas.has(fonte)) return;

  carregadas.add(fonte);
  void CARREGADORES[fonte]?.().catch(() => carregadas.delete(fonte));
}

export const carregarTodasAsFontes = () =>
  (Object.keys(CARREGADORES) as (keyof typeof CARREGADORES)[]).forEach(
    carregarFonte,
  );
