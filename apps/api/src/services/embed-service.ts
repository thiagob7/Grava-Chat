import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export interface Embed {
  url: string;
  kind: "link" | "video" | "imagem";
  site: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  author: string | null;
  player: string | null;
  color: string | null;
  width: number | null;
  height: number | null;
}

const TEMPO_LIMIT = 6_000;
const BYTES_MAX = 768 * 1024;
const CACHE_MS = 30 * 60_000;
const CACHE_FAILURE_MS = 5 * 60_000;
const CACHE_MAX = 500;

const UA = "Mozilla/5.0 (compatible; GravaeBot/1.0)";

const cache = new Map<string, { em: number; until: number; value: Embed | null }>();

function privateAddress(ip: string): boolean {
  if (ip.includes(":")) {
    const down = ip.toLowerCase();
    if (down.startsWith("::ffff:")) return privateAddress(down.slice(7));
    return (
      down === "::1" ||
      down === "::" ||
      down.startsWith("fc") ||
      down.startsWith("fd") ||
      down.startsWith("fe80")
    );
  }

  const [a = 0, b = 0] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a >= 224
  );
}

async function canSearch(target: URL): Promise<boolean> {
  if (target.protocol !== "http:" && target.protocol !== "https:") return false;

  const host = target.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) return !privateAddress(host);

  return lookup(host, { all: true })
    .then((matches) => matches.length > 0 && matches.every(({ address }) => !privateAddress(address)))
    .catch(() => false);
}

async function search(url: string, accept: string) {
  const control = new AbortController();
  const clock = setTimeout(() => control.abort(), TEMPO_LIMIT);

  return fetch(url, {
    signal: control.signal,
    redirect: "follow",
    headers: { "user-agent": UA, accept, "accept-language": "pt-BR,pt;q=0.9,en;q=0.8" },
  }).finally(() => clearTimeout(clock));
}

async function readStart(reply: Response): Promise<string> {
  const reader = reply.body?.getReader();
  if (!reader) return "";

  const decoder = new TextDecoder("utf-8");
  let text = "";
  let read = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    read += value.length;
    text += decoder.decode(value, { stream: true });

    const alreadyHasNeeds = /og:(title|description|image)/i.test(text) && /<\/head>/i.test(text);

    if (read >= BYTES_MAX || alreadyHasNeeds) {
      await reader.cancel().catch(() => undefined);
      break;
    }
  }

  return text;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  after: "'",
  nbsp: " ",
  "#39": "'",
  "#x27": "'",
  "#x2F": "/",
};

const unescape = (text: string) =>
  text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, name: string) => {
    const known = ENTITIES[name] ?? ENTITIES[name.toLowerCase()];
    if (known) return known;

    const number = /^#x/i.test(name)
      ? Number.parseInt(name.slice(2), 16)
      : /^#/.test(name)
        ? Number.parseInt(name.slice(1), 10)
        : NaN;

    return Number.isFinite(number) ? String.fromCodePoint(number) : whole;
  });

const attribute = (tag: string, name: string) =>
  new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i")
    .exec(tag)
    ?.slice(2)
    .find((v) => v !== undefined) ?? null;

function metatags(html: string): Map<string, string> {
  const matches = new Map<string, string>();

  for (const [tag] of html.matchAll(/<meta\s[^>]*>/gi)) {
    const key = attribute(tag, "property") ?? attribute(tag, "name") ?? attribute(tag, "itemprop");
    const value = attribute(tag, "content");
    if (!key || !value) continue;

    const name = key.trim().toLowerCase();
    if (!matches.has(name)) matches.set(name, unescape(value.trim()));
  }

  return matches;
}

function pageIcon(html: string, base: URL): string | null {
  for (const [tag] of html.matchAll(/<link\s[^>]*>/gi)) {
    const rel = attribute(tag, "rel")?.toLowerCase() ?? "";
    if (!/\bicon\b/.test(rel)) continue;

    const href = attribute(tag, "href");
    if (href) return absolute(unescape(href), base);
  }

  return `${base.origin}/favicon.ico`;
}

const absolute = (address: string, base: URL): string | null => {
  try {
    return new URL(address, base).toString();
  } catch {
    return null;
  }
};

const number = (value: string | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

function themeColor(value: string | null): string | null {
  const color = value?.trim();
  if (!color || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return null;

  const full =
    color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;

  const channel = (start: number) => {
    const raw = Number.parseInt(full.slice(start, start + 2), 16) / 255;
    return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
  };

  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);

  return luminance >= 0.05 ? full : null;
}

const VIDEO_DO_YOUTUBE =
  /^https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{6,20})/i;

async function fromYouTube(url: string, id: string): Promise<Embed | null> {
  const oembed = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${id}`,
  )}`;

  const data = await search(oembed, "application/json")
    .then((r) => (r.ok ? (r.json() as Promise<Record<string, unknown>>) : null))
    .catch(() => null);

  if (!data) return null;

  const text = (key: string) =>
    typeof data[key] === "string" ? (data[key] as string) : null;

  return {
    url,
    kind: "video",
    site: "YouTube",
    title: text("title"),
    description: null,
    image: text("thumbnail_url") ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    favicon: "https://www.youtube.com/favicon.ico",
    author: text("author_name"),
    player: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
    color: "#ff0000",
    width: number(String(data.thumbnail_width)) ?? 480,
    height: number(String(data.thumbnail_height)) ?? 360,
  };
}

async function build(url: string): Promise<Embed | null> {
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return null;
  }

  if (!(await canSearch(target))) return null;

  const fromPipe = VIDEO_DO_YOUTUBE.exec(url);
  if (fromPipe?.[1]) return youTubeFromVideo(url, fromPipe[1], target);

  return pageCard(url, target);
}

async function pageCard(url: string, target: URL): Promise<Embed | null> {
  const reply = await search(url, "text/html,application/xhtml+xml").catch(() => null);
  if (!reply?.ok) return null;

  const contentKind = reply.headers.get("content-type") ?? "";

  if (contentKind.startsWith("image/")) {
    await reply.body?.cancel().catch(() => undefined);
    return {
      url,
      kind: "imagem",
      site: target.hostname.replace(/^www\./, ""),
      title: null,
      description: null,
      image: url,
      favicon: `${target.origin}/favicon.ico`,
      author: null,
      player: null,
      color: null,
      width: null,
      height: null,
    };
  }

  if (!contentKind.includes("html")) {
    await reply.body?.cancel().catch(() => undefined);
    return null;
  }

  const html = await readStart(reply);
  const meta = metatags(html);
  const base = new URL(reply.url || url);

  const first = (...keys: string[]) => {
    for (const key of keys) {
      const value = meta.get(key);
      if (value) return value;
    }
    return null;
  };

  const tagTitle = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  const title =
    first("og:title", "twitter:title") ??
    (tagTitle ? unescape(tagTitle.trim()) : null);

  const image = first("og:image:secure_url", "og:image:url", "og:image", "twitter:image", "twitter:image:src");
  const player = first("og:video:secure_url", "og:video:url", "og:video", "twitter:player");
  const description = first("og:description", "twitter:description", "description");

  if (!title && !description && !image) return null;

  return {
    url,
    kind: player ? "video" : "link",
    site: first("og:site_name", "application-name") ?? base.hostname.replace(/^www\./, ""),
    title,
    description,
    image: image ? absolute(image, base) : null,
    favicon: pageIcon(html, base),
    author: first("article:author", "twitter:creator", "author"),
    player: player ? absolute(player, base) : null,
    color: themeColor(first("theme-color", "msapplication-TileColor")),
    width: number(first("og:image:width") ?? undefined),
    height: number(first("og:image:height") ?? undefined),
  };
}

async function youTubeFromVideo(url: string, id: string, target: URL): Promise<Embed | null> {
  const byOembed = await fromYouTube(url, id);
  if (byOembed) return byOembed;

  const page = await pageCard(url, target);
  if (!page?.title || !page.image) return null;

  return {
    ...page,
    site: "YouTube",
    kind: "video",
    player: null,
    image: page.image ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

function keep(url: string, value: Embed | null) {
  if (cache.size >= CACHE_MAX) {
    const oldMore = [...cache.entries()].reduce((a, b) => (a[1].em <= b[1].em ? a : b));
    cache.delete(oldMore[0]);
  }

  cache.set(url, { em: Date.now(), until: Date.now() + (value ? CACHE_MS : CACHE_FAILURE_MS), value });
}

const inFlight = new Map<string, Promise<Embed | null>>();

export const embedService = {
  async resolve(url: string): Promise<Embed | null> {
    const kept = cache.get(url);
    if (kept && kept.until > Date.now()) return kept.value;

    const alreadyRequest = inFlight.get(url);
    if (alreadyRequest) return alreadyRequest;

    const request = build(url)
      .catch(() => null)
      .then((value) => {
        keep(url, value);
        return value;
      })
      .finally(() => inFlight.delete(url));

    inFlight.set(url, request);
    return request;
  },
};
