const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** "hoje às 14:32" / "ontem às 09:10" / "05/08/2026 21:00" */
export function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(d, now)) return `hoje às ${time.format(d)}`;
  if (isSameDay(d, yesterday)) return `ontem às ${time.format(d)}`;
  return `${dayMonth.format(d)} ${time.format(d)}`;
}

export const formatTime = (iso: string) => time.format(new Date(iso));

export function formatDayDivider(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(d, now)) return "Hoje";
  if (isSameDay(d, yesterday)) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

/** Cor determinística do avatar a partir do id — evita todo mundo cinza. */
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
