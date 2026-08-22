/**
 * As famílias por trás de cada id de fonte.
 *
 * Toda declaração termina em `var(--font-sans)`: se o arquivo da fonte não
 * carregar — rede caída, aplicativo de desktop offline, chunk que falhou — o
 * nome cai na fonte do app e continua legível. Nenhum caminho leva a texto
 * invisível ou a `serif` do sistema aparecendo do nada no meio do chat.
 *
 * O carregamento em si é da Fase 3 (`@fontsource/*` sob demanda, o mesmo padrão
 * que `lib/emoji.ts` já usa com o dataset de emoji). Até lá, quem escolher uma
 * fonte decorativa vê o fallback — degrada, não quebra.
 */
import type { FonteDeNome } from "@gravae/shared";

/**
 * Os nomes de família batem com os pacotes que a Fase 3 vai instalar:
 * Lora, JetBrains Mono, Bebas Neue e Caveat.
 */
export const FAMILIA_DE_FONTE: Record<FonteDeNome, string> = {
  padrao: "var(--font-sans)",
  serifada: '"Lora", ui-serif, Georgia, serif',
  monoespacada: '"JetBrains Mono", ui-monospace, "SF Mono", monospace',
  titulo: '"Bebas Neue", "Impact", var(--font-sans)',
  manuscrita: '"Caveat", "Brush Script MT", cursive',
};

/** `padrao` não vira propriedade nenhuma — é a ausência de escolha. */
export function familiaDaFonte(fonte: FonteDeNome | null | undefined): string | null {
  if (!fonte || fonte === "padrao") return null;

  return FAMILIA_DE_FONTE[fonte] ?? null;
}
