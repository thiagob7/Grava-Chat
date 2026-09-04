
export const LIMITE_POR_JANELA = 10;

export const JANELA_S = 10;

export function passouDoFluxo(usos: number, limite = LIMITE_POR_JANELA): boolean {
  return usos > limite;
}

export function mensagemDeFluxo(segundosRestantes: number): string {
  return `Você está mandando mensagem rápido demais. Espere ${Math.max(segundosRestantes, 1)}s.`;
}
