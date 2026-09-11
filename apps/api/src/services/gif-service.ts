import { AppError } from "~/lib/http.js";
import { env } from "~/env.js";

const BASE = "https://api.klipy.com/v2";
const CACHE_MS = 5 * 60_000;

export interface Gif {
  id: string;
  description: string;
  url: string;
  preview: string;
  width: number;
  height: number;
}

const cache = new Map<string, { em: number; data: unknown[] }>();

interface ReplyGif {
  results?: {
    id: string;
    title?: string;
    content_description?: string;
    media_formats?: Record<string, { url: string; dims?: [number, number] }>;
  }[];
}

function convert(reply: ReplyGif): Gif[] {
  return (reply.results ?? []).flatMap((item) => {
    const formats = item.media_formats;
    const full = formats?.webp ?? formats?.mediumgif ?? formats?.gif;
    const light = formats?.tinygif ?? formats?.nanogif ?? full;
    if (!full || !light) return [];

    return [
      {
        id: item.id,
        description: item.title || item.content_description || "GIF",
        url: full.url,
        preview: light.url,
        width: full.dims?.[0] ?? 0,
        height: full.dims?.[1] ?? 0,
      },
    ];
  });
}

export interface GifCategory {
  term: string;
  name: string;
  preview: string;
}

interface ReplyCategory {
  tags?: { searchterm?: string; name?: string; image?: string }[];
}

function convertCategories(reply: ReplyCategory): GifCategory[] {
  return (reply.tags ?? []).flatMap((tag) => {
    const term = tag.searchterm?.trim();
    if (!term || !tag.image) return [];

    return [{ term, name: (tag.name ?? term).replace(/^#/, ""), preview: tag.image }];
  });
}

async function askFor(path: string, params: Record<string, string>) {
  if (!env.KLIPY_API_KEY) {
    throw new AppError("A busca de GIF precisa de uma chave da KLIPY no .env (KLIPY_API_KEY)", 503);
  }

  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", env.KLIPY_API_KEY);
  url.searchParams.set("client_key", "gravae-chat");
  url.searchParams.set("media_filter", "webp,gif,mediumgif,tinygif,nanogif");
  url.searchParams.set("country", "BR");
  url.searchParams.set("locale", "pt_BR");

  const reply = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!reply.ok) throw new AppError("O serviço de GIF não respondeu agora", 502);

  return reply.json();
}

async function withCache<T>(
  path: string,
  params: Record<string, string>,
  convert: (raw: unknown) => T[],
): Promise<T[]> {
  const key = `${path}?${new URLSearchParams(params)}`;
  const kept = cache.get(key);
  if (kept && Date.now() - kept.em < CACHE_MS) return kept.data as T[];

  const data = convert(await askFor(path, params));
  cache.set(key, { em: Date.now(), data });

  return data;
}

export const gifService = {
  available: () => Boolean(env.KLIPY_API_KEY),

  search: (q: string, limit = 30) =>
    withCache("search", { q, limit: String(limit) }, (b) => convert(b as ReplyGif)),

  inHigh: (limit = 30) =>
    withCache("featured", { limit: String(limit) }, (b) => convert(b as ReplyGif)),

  categories: () =>
    withCache("categories", { type: "featured" }, (b) => convertCategories(b as ReplyCategory)),
};
