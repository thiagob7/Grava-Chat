export const EVENT_FREQUENCIES = [
  "once",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
] as const;

export type EventFrequency = (typeof EVENT_FREQUENCIES)[number];

export const EVENT_FREQUENCY_LABELS: Record<EventFrequency, string> = {
  once: "Não se repete",
  daily: "Todo dia",
  weekly: "Toda semana",
  biweekly: "A cada duas semanas",
  monthly: "Todo mês",
};

export const EVENT_LIMITS = {
  name: 100,
  description: 1000,
  location: 100,
  perGuild: 100,
} as const;

export interface EventAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface GuildEvent {
  id: string;
  guildId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  startsAt: string;
  frequency: EventFrequency;
  channelId: string | null;
  channelName: string | null;
  externalLocation: string | null;
  interestedCount: number;
  isInterested: boolean;
  startedAt: string | null;
  author: EventAuthor | null;
}

export const eventHasPassed = (event: { startsAt: string }, now = Date.now()) =>
  new Date(event.startsAt).getTime() < now;

const DAYS_BY_FREQUENCY = { daily: 1, weekly: 7, biweekly: 14 } as const;

export function nextOccurrence(
  startsAt: string,
  frequency: EventFrequency,
  now = Date.now(),
): string {
  const start = new Date(startsAt);

  if (frequency === "once" || start.getTime() >= now) return start.toISOString();

  const next = new Date(start);

  if (frequency === "monthly") {
    while (next.getTime() < now) next.setMonth(next.getMonth() + 1);
    return next.toISOString();
  }

  const step = DAYS_BY_FREQUENCY[frequency] * 86_400_000;
  const skipped = Math.ceil((now - start.getTime()) / step);

  next.setTime(start.getTime() + skipped * step);
  return next.toISOString();
}
