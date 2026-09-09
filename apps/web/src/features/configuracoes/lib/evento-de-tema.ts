export const TEMA_APLICADO = "gc:tema-aplicado";

export function avisarTemaAplicado() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(TEMA_APLICADO));
}
