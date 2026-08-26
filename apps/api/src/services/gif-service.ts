import { AppError } from "~/lib/http.js";
import { env } from "~/env.js";

const BASE = "https://api.klipy.com/v2";
const CACHE_MS = 5 * 60_000;

export interface Gif {
  id: string;
  descricao: string;
  url: string;
  preview: string;
  width: number;
  height: number;
}

const cache = new Map<string, { em: number; dados: unknown[] }>();

interface RespostaGif {
  results?: {
    id: string;
    title?: string;
    content_description?: string;
    media_formats?: Record<string, { url: string; dims?: [number, number] }>;
  }[];
}

function converter(resposta: RespostaGif): Gif[] {
  return (resposta.results ?? []).flatMap((item) => {
    const formatos = item.media_formats;
    const cheio = formatos?.webp ?? formatos?.mediumgif ?? formatos?.gif;
    const leve = formatos?.tinygif ?? formatos?.nanogif ?? cheio;
    if (!cheio || !leve) return [];

    return [
      {
        id: item.id,
        descricao: item.title || item.content_description || "GIF",
        url: cheio.url,
        preview: leve.url,
        width: cheio.dims?.[0] ?? 0,
        height: cheio.dims?.[1] ?? 0,
      },
    ];
  });
}

export interface CategoriaDeGif {
  termo: string;
  nome: string;
  preview: string;
}

interface RespostaCategoria {
  tags?: { searchterm?: string; name?: string; image?: string }[];
}

/// A Klipy devolve o nome com "#" na frente ("#happy birthday"); quem lê a
/// grade não quer a cerquilha.
function converterCategorias(resposta: RespostaCategoria): CategoriaDeGif[] {
  return (resposta.tags ?? []).flatMap((tag) => {
    const termo = tag.searchterm?.trim();
    if (!termo || !tag.image) return [];

    return [{ termo, nome: (tag.name ?? termo).replace(/^#/, ""), preview: tag.image }];
  });
}

async function pedir(caminho: string, params: Record<string, string>) {
  if (!env.KLIPY_API_KEY) {
    throw new AppError("A busca de GIF precisa de uma chave da KLIPY no .env (KLIPY_API_KEY)", 503);
  }

  const url = new URL(`${BASE}/${caminho}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", env.KLIPY_API_KEY);
  url.searchParams.set("client_key", "gravae-chat");
  url.searchParams.set("media_filter", "webp,gif,mediumgif,tinygif,nanogif");
  url.searchParams.set("country", "BR");
  url.searchParams.set("locale", "pt_BR");

  const resposta = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!resposta.ok) throw new AppError("O serviço de GIF não respondeu agora", 502);

  return resposta.json();
}

/// Uma chamada à Klipy por caminho+parâmetros, guardada por alguns minutos. O
/// `converter` roda sobre o que veio da rede, não sobre o que saiu do cache.
async function comCache<T>(
  caminho: string,
  params: Record<string, string>,
  converter: (bruto: unknown) => T[],
): Promise<T[]> {
  const chave = `${caminho}?${new URLSearchParams(params)}`;
  const guardado = cache.get(chave);
  if (guardado && Date.now() - guardado.em < CACHE_MS) return guardado.dados as T[];

  const dados = converter(await pedir(caminho, params));
  cache.set(chave, { em: Date.now(), dados });

  return dados;
}

export const gifService = {
  disponivel: () => Boolean(env.KLIPY_API_KEY),

  buscar: (q: string, limit = 30) =>
    comCache("search", { q, limit: String(limit) }, (b) => converter(b as RespostaGif)),

  emAlta: (limit = 30) =>
    comCache("featured", { limit: String(limit) }, (b) => converter(b as RespostaGif)),

  categorias: () =>
    comCache("categories", { type: "featured" }, (b) => converterCategorias(b as RespostaCategoria)),
};
