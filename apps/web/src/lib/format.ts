import { i18next, idiomaAtual } from "~/traducao";
import { prefsDeAparencia } from "~/stores/aparencia";

const formatadores = new Map<string, Intl.DateTimeFormat>();

function guardado(sufixo: string, montar: () => Intl.DateTimeFormat): Intl.DateTimeFormat {
  const chave = `${idiomaAtual()}|${sufixo}`;
  let pronto = formatadores.get(chave);

  if (!pronto) {
    pronto = montar();
    formatadores.set(chave, pronto);
  }

  return pronto;
}

function formatadorDeHora(): Intl.DateTimeFormat {
  const em24h = prefsDeAparencia().horaEm24h;

  return guardado(em24h ? "24h" : "12h", () =>
    new Intl.DateTimeFormat(idiomaAtual(), {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !em24h,
    }),
  );
}

const time = { format: (d: Date) => formatadorDeHora().format(d) };
const dayMonth = {
  format: (d: Date) =>
    guardado(
      "dia-mes",
      () =>
        new Intl.DateTimeFormat(idiomaAtual(), {
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

  return guardado(
    "dia-por-extenso",
    () =>
      new Intl.DateTimeFormat(idiomaAtual(), {
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
