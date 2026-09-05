/// Quanto tempo esperar antes de trocar a cópia da sessão de novo. Sem isto,
/// um servidor que recusa por outro motivo faria uma troca por tentativa.
export const ESPERA_ENTRE_TROCAS_MS = 15_000;

/// O aperto de mão foi recusado por causa do token?
export const ehRecusaPorToken = (mensagem: string) => /token/i.test(mensagem);

export function deveTrocarToken(
  mensagem: string,
  agora: number,
  ultimaTroca: number,
  espera = ESPERA_ENTRE_TROCAS_MS,
): boolean {
  if (!ehRecusaPorToken(mensagem)) return false;

  return agora - ultimaTroca >= espera;
}
