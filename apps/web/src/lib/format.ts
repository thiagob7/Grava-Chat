import { prefsDeAparencia } from "~/stores/aparencia";

/*
  A hora, no formato que a pessoa escolheu.

  Um `Intl.DateTimeFormat` por formato, guardado: montar o objeto custa, e o
  horário é desenhado em toda mensagem da tela. Perguntar a preferência a cada
  chamada é barato; construir o formatador não é.

  `hour12: false` NÃO é o mesmo que omitir: com `pt-BR` e 2 dígitos, o padrão
  já é 24h, mas ser explícito deixa os dois caminhos simétricos e evita que
  uma mudança de locale escolha por nós.
*/
const formatadores = new Map<boolean, Intl.DateTimeFormat>();

function formatadorDeHora(): Intl.DateTimeFormat {
  const em24h = prefsDeAparencia().horaEm24h;
  let pronto = formatadores.get(em24h);

  if (!pronto) {
    pronto = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !em24h,
    });

    formatadores.set(em24h, pronto);
  }

  return pronto;
}

const time = { format: (d: Date) => formatadorDeHora().format(d) };
const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

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
