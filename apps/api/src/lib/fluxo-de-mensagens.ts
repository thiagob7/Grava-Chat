
export const LIMIT_BY_WINDOW = 10;

export const WINDOW_S = 10;

export function flowPassed(uses: number, limit = LIMIT_BY_WINDOW): boolean {
  return uses > limit;
}

export function flowMessage(secondsRemaining: number): string {
  return `Você está mandando mensagem rápido demais. Espere ${Math.max(secondsRemaining, 1)}s.`;
}
