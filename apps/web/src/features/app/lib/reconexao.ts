export const ESPERA_ENTRE_TROCAS_MS = 15_000;

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
