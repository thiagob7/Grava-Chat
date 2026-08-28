/**
 * Quando avisar que a conexão de alguém está ruim, e como.
 *
 * A regra tem uma decisão dentro que é fácil de errar: **só se avisa do que
 * está ruim**. Marcar "excelente" em todo mundo enche a grade de selo verde e
 * treina a pessoa a ignorar a área — e aí, no dia em que um selo importa, ele
 * some no meio dos outros. Um aviso que aparece sempre não é aviso, é enfeite.
 *
 * Isso resolve uma pergunta concreta na chamada: quando alguém falha, é a
 * internet de quem fala ou a de quem ouve? Sem o selo, todo mundo culpa o
 * próprio Wi-Fi e ninguém acerta.
 *
 * O tipo é uma união de strings e não o enum do LiveKit de propósito: assim a
 * regra tem teste sem precisar de uma sala conectada.
 */
export type Qualidade = "excellent" | "good" | "poor" | "lost" | "unknown" | string;

export interface AvisoDeQualidade {
  /// o que aparece ao parar o mouse em cima
  rotulo: string;
  /// classe de cor do selo
  cor: string;
  /// conexão perdida pisca; ruim fica parada
  pulsando: boolean;
}

export function avisoDeQualidade(qualidade: Qualidade): AvisoDeQualidade | null {
  if (qualidade === "poor") {
    return { rotulo: "Conexão instável", cor: "text-idle", pulsando: false };
  }

  if (qualidade === "lost") {
    return { rotulo: "Conexão perdida", cor: "text-danger", pulsando: true };
  }

  /*
    `excellent`, `good` e `unknown` não geram selo.

    `unknown` entra aqui e não num estado próprio porque é o valor dos
    primeiros segundos, antes do LiveKit ter medida: avisar ali marcaria todo
    mundo que acabou de entrar como problema.
  */
  return null;
}
