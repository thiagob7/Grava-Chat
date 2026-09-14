export const WAIT_BETWEEN_SWAPS_MS = 15_000;

export const RETRY_FIRST_MS = 1_000;

export const RETRY_MAX_MS = 15_000;

export const isRefusalByToken = (message: string) => /token/i.test(message);

export function mustSwapToken(
  message: string,
  now: number,
  lastSwap: number,
  wait = WAIT_BETWEEN_SWAPS_MS,
): boolean {
  if (!isRefusalByToken(message)) return false;

  return now - lastSwap >= wait;
}
