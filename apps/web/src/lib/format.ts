import { i18next, currentLanguage } from "~/traducao";
import { appearancePrefs } from "~/features/configuracoes/stores/aparencia";

const formatters = new Map<string, Intl.DateTimeFormat>();

function kept(suffix: string, build: () => Intl.DateTimeFormat): Intl.DateTimeFormat {
  const key = `${currentLanguage()}|${suffix}`;
  let ready = formatters.get(key);

  if (!ready) {
    ready = build();
    formatters.set(key, ready);
  }

  return ready;
}

function hourFormatter(): Intl.DateTimeFormat {
  const in24h = appearancePrefs().hourIn24h;

  return kept(in24h ? "24h" : "12h", () =>
    new Intl.DateTimeFormat(currentLanguage(), {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !in24h,
    }),
  );
}

const time = { format: (d: Date) => hourFormatter().format(d) };
const dayMonth = {
  format: (d: Date) =>
    kept(
      "dia-mes",
      () =>
        new Intl.DateTimeFormat(currentLanguage(), {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
    ).format(d),
};

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(d, now)) return i18next.t("conversa.data.hojeAs", { hora: time.format(d) });
  if (isSameDay(d, yesterday))
    return i18next.t("conversa.data.ontemAs", { hora: time.format(d) });
  return `${dayMonth.format(d)} ${time.format(d)}`;
}

export const formatTime = (iso: string) => time.format(new Date(iso));

export function formatDayDivider(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(d, now)) return i18next.t("conversa.data.hoje");
  if (isSameDay(d, yesterday)) return i18next.t("conversa.data.ontem");

  return kept(
    "dia-por-extenso",
    () =>
      new Intl.DateTimeFormat(currentLanguage(), {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
  ).format(d);
}

const AVATAR_COLORS = ["#5865f2", "#3ba55c", "#faa61a", "#ed4245", "#eb459e", "#00a8fc", "#9b59b6"];

export const avatarColor = (id: string) => {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

export const formatShortDate = (iso: string) =>
  kept(
    "data-curta",
    () =>
      new Intl.DateTimeFormat(currentLanguage(), {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
  ).format(new Date(iso));
