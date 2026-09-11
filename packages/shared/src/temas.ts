import { houseAddress } from "./origens.js";

export interface ThemeHeader {
  name: string | null;
  description: string | null;
  author: string | null;
  version: string | null;
  font: string | null;
  invite: string | null;
  tags: string[];
}

/*
  Um ativo do tema: a imagem que o CSS chama por `gc-ativo("nome")`.

  Ele viaja junto com o tema porque sem isso o tema chega quebrado do outro
  lado: o CSS pede o fundo, não acha nada para resolver, e a pessoa instala um
  tema sem a imagem que era o motivo dele existir.
*/
export interface ThemeActive {
  name: string;
  url: string;
  kind?: string;
  bytes?: number;
}

export const ACTIVE_LIMIT = 12;

/*
  O peso que a pessoa vê antes de instalar: o CSS mais o que cada imagem pesa.
  Ativo sem tamanho conhecido não some do total, só não soma nada.
*/
export function themeWeight(css: string, actives: ThemeActive[] = []): number {
  const fromCss = new TextEncoder().encode(css).length;
  return actives.reduce((total, active) => total + (active.bytes ?? 0), fromCss);
}

export function weightReadable(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface ThemeShared {
  id: string;
  name: string;
  description: string | null;
  author: string | null;
  version: string | null;
  tags: string[];
  css: string;
  overrides: Record<string, string>;
  actives: ThemeActive[];
  publishedBy: { id: string; displayName: string; avatarUrl: string | null };
  createdAt: string;
}

export const THEME_LIMITS = {
  name: 60,
  description: 300,
  author: 60,
  version: 20,
  address: 300,
  tags: 8,
  tag: 24,
  css: 512 * 1024,
  overrides: 600,
};

const EMPTY: ThemeHeader = {
  name: null,
  description: null,
  author: null,
  version: null,
  font: null,
  invite: null,
  tags: [],
};

const soHttps = (value: string | undefined, size: number) => {
  const clean = (value ?? "").trim();
  if (!clean.startsWith("https://")) return null;

  return clean.slice(0, size) || null;
};

const cut = (value: string, size: number) => value.trim().slice(0, size) || null;

export function readThemeHeader(css: string): ThemeHeader {
  const block = /^\s*\/\*\*([\s\S]*?)\*\//.exec(css);
  if (!block?.[1]) return EMPTY;

  const lines = block[1]
    .split("\n")
    .map((line) => line.replace(/^\s*\*?\s?/, "").trimEnd())
    .filter(Boolean);

  const fields = new Map<string, string>();

  for (const line of lines) {
    const field = /^@([a-zA-Z]+)\s+(.*)$/.exec(line);
    if (field?.[1] && field[2]) fields.set(field[1].toLowerCase(), field[2]);
  }

  const tags = (fields.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim().slice(0, THEME_LIMITS.tag))
    .filter(Boolean)
    .slice(0, THEME_LIMITS.tags);

  return {
    name: cut(fields.get("name") ?? "", THEME_LIMITS.name),
    description: cut(fields.get("description") ?? "", THEME_LIMITS.description),
    author: cut(fields.get("author") ?? "", THEME_LIMITS.author),
    version: cut(fields.get("version") ?? "", THEME_LIMITS.version),
    font: soHttps(fields.get("updateurl"), THEME_LIMITS.address),
    invite: soHttps(fields.get("invite"), THEME_LIMITS.address),
    tags,
  };
}

export function writeThemeHeader(header: ThemeHeader): string {
  const lines = [
    header.name && ` * @name ${header.name}`,
    header.description && ` * @description ${header.description}`,
    header.author && ` * @author ${header.author}`,
    header.version && ` * @version ${header.version}`,
    header.font && ` * @updateUrl ${header.font}`,
    header.invite && ` * @invite ${header.invite}`,
    header.tags.length > 0 && ` * @tags ${header.tags.join(", ")}`,
  ].filter(Boolean);

  if (!lines.length) return "";

  return ["/**", ...lines, " */"].join("\n");
}

export function withHeader(css: string, header: ThemeHeader): string {
  const body = css.replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, "");
  const block = writeThemeHeader(header);

  return block ? `${block}\n\n${body}` : body;
}

export const THEME_PATH = "/tema/";

export function themeLinkId(
  url: string,
  origin: string | readonly string[],
): string | null {
  const address = houseAddress(url, origin);
  if (!address) return null;

  const found = new RegExp(`^${THEME_PATH}([a-f\\d]{24})$`, "i").exec(
    address.pathname,
  );

  return found?.[1] ?? null;
}
