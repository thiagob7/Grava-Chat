import type { FonteDeNome } from "@gravae/shared";

/**
 * As famílias por trás de cada id de fonte.
 *
 * Toda declaração termina em `var(--font-sans)`: se o arquivo da fonte não
 * carregar — chunk que falhou, disco cheio, o que for — o nome cai na fonte do
 * app e continua legível. Nenhum caminho leva a texto invisível.
 */
export const FAMILIA_DE_FONTE: Record<FonteDeNome, string> = {
  padrao: "var(--font-sans)",
  serifada: '"Lora", ui-serif, Georgia, serif',
  monoespacada: '"JetBrains Mono", ui-monospace, "SF Mono", monospace',
  titulo: '"Bebas Neue", "Impact", var(--font-sans)',
  manuscrita: '"Caveat", "Brush Script MT", cursive',
};

/** `padrao` não vira propriedade nenhuma — é a ausência de escolha. */
export function familiaDaFonte(
  fonte: FonteDeNome | null | undefined,
): string | null {
  if (!fonte || fonte === "padrao") return null;

  return FAMILIA_DE_FONTE[fonte] ?? null;
}

/**
 * Carrega o arquivo de uma fonte decorativa, SOB DEMANDA.
 *
 * Mesmo padrão que `lib/emoji.ts` já usa com o dataset de emoji: o `import()`
 * dinâmico faz o Vite emitir cada `.css` como um chunk próprio, com o
 * `@font-face` apontando para um asset com hash. Funciona de qualquer origem,
 * sem CDN, e nenhum byte disso entra no carregamento inicial.
 *
 * As cinco juntas dão ~150–250 KB. Uma pessoa que nunca abre o editor e nunca
 * cruza com um nome enfeitado não baixa nenhum.
 */
const CARREGADORES: Record<
  Exclude<FonteDeNome, "padrao">,
  () => Promise<unknown>
> = {
  serifada: () => import("@fontsource/lora/400.css"),
  monoespacada: () => import("@fontsource/jetbrains-mono/400.css"),
  titulo: () => import("@fontsource/bebas-neue/400.css"),
  manuscrita: () => import("@fontsource/caveat/400.css"),
};

/** Uma vez cada: o `import()` já é cacheado, mas o `Set` evita até a promessa. */
const carregadas = new Set<string>();

export function carregarFonte(fonte: FonteDeNome | null | undefined): void {
  if (!fonte || fonte === "padrao" || carregadas.has(fonte)) return;

  carregadas.add(fonte);
  // falha em carregar é silenciosa DE PROPÓSITO: o `font-family` cai no
  // fallback e o nome continua legível — não há o que avisar a quem lê
  void CARREGADORES[fonte]?.().catch(() => carregadas.delete(fonte));
}

/** Todas de uma vez — o editor precisa mostrar as amostras juntas. */
export const carregarTodasAsFontes = () =>
  (Object.keys(CARREGADORES) as (keyof typeof CARREGADORES)[]).forEach(
    carregarFonte,
  );
