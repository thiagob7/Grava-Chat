export const KEEP_DAYS = 90;

export const KEEP_MESSAGES = 40_000;

export const PAGE_DEFAULT = 50;
export const PAGE_CEILING = 200;

export function accountFile(accountId: string): string | null {
  return /^[0-9a-f]{24}$/i.test(accountId) ? `${accountId.toLowerCase()}.db` : null;
}

export function cutOff(now: number, days = KEEP_DAYS): number {
  return now - days * 24 * 60 * 60 * 1000;
}

export function pageSize(asked: number | undefined): number {
  if (!asked || !Number.isFinite(asked)) return PAGE_DEFAULT;
  return Math.min(Math.max(Math.trunc(asked), 1), PAGE_CEILING);
}

export function whenIn(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export const SEND_TRIES_CEILING = 10;

export const QUEUE_KEEP_DAYS = 7;
