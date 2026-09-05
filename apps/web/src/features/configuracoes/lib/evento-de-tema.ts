/*
  Avisa que o tema mudou.

  Quase tudo no app segue tema sozinho, porque lê o token direto no CSS. O que
  precisa deste aviso é o punhado de medidas que vive em JavaScript — a largura
  das laterais, que a pessoa pode arrastar — e por isso só descobre um valor
  novo quando alguém conta.
*/
export const TEMA_APLICADO = "gc:tema-aplicado";

export function avisarTemaAplicado() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(TEMA_APLICADO));
}
