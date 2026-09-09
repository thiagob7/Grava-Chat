const DAY_MS = 86_400_000;
const DEFAULT_DURATION_MS = 2 * 3_600_000;

const TIME = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const DATE = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });
const DATE_WITH_YEAR = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const midnight = (ms: number) => {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export function formatEventDate(iso: string, now = Date.now()): string {
  const startsAt = new Date(iso).getTime();
  const days = Math.round((midnight(startsAt) - midnight(now)) / DAY_MS);
  const time = TIME.format(startsAt);

  if (days === 0) return `Hoje às ${time}`;
  if (days === 1) return `Amanhã às ${time}`;
  if (days === -1) return `Ontem às ${time}`;

  const sameYear = new Date(startsAt).getFullYear() === new Date(now).getFullYear();
  const date = (sameYear ? DATE : DATE_WITH_YEAR).format(startsAt);

  return `${date} às ${time}`;
}

export function timeUntilEvent(iso: string, now = Date.now()): number {
  return new Date(iso).getTime() - now;
}

export const isEventLive = (
  iso: string,
  durationMs = DEFAULT_DURATION_MS,
  now = Date.now(),
) => {
  const startsAt = new Date(iso).getTime();
  return now >= startsAt && now < startsAt + durationMs;
};
