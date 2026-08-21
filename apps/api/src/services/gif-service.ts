import { AppError } from "~/lib/http.js";
import { env } from "~/env.js";

/**
 * Busca de GIF, sempre pelo servidor.
 *
 * A chave nunca vai pro navegador: quem tem a chave gasta a cota, e uma chave
 * no bundle é uma chave pública. O cache curto aqui também segura a mão pesada
 * de quem fica digitando e apagando na busca.
 *
 * O provedor é a KLIPY. Era a Tenor até 2026-08 — o Google desligou a API dela
 * em 30/06/2026 e parou de aceitar clientes novos em janeiro, então não havia
 * nem como pegar uma chave. A KLIPY se propõe como troca direta: mesmos
 * caminhos (`/v2/search`, `/v2/featured`), mesma chave em `key=` e o mesmo
 * formato de resposta — o que muda de verdade é só o domínio.
 */
const BASE = "https://api.klipy.com/v2";
const CACHE_MS = 5 * 60_000;

export interface Gif {
  id: string;
  descricao: string;
  /** o arquivo que vai pro chat */
  url: string;
  /** versão leve, para a grade do seletor */
  preview: string;
  width: number;
  height: number;
}

const cache = new Map<string, { em: number; dados: Gif[] }>();

/** O formato que a Tenor definiu e a KLIPY manteve. */
interface RespostaGif {
  results?: {
    id: string;
    /** a KLIPY põe o nome aqui; `content_description` vem vazio */
    title?: string;
    content_description?: string;
    media_formats?: Record<string, { url: string; dims?: [number, number] }>;
  }[];
}

/**
 * Formatos, escolhidos medindo o que vem de verdade (média de uma busca):
 * `gif` 11 MB · `mediumgif` 6 MB · `webp` 981 KB no MESMO tamanho de tela ·
 * `tinygif` 1,1 MB · `nanogif` 299 KB.
 *
 * Por isso o que vai pro chat é o **webp animado** (mesma imagem, 11× mais
 * leve) e a grade usa o `tinygif`. Mandar 11 MB pra alguém no celular por causa
 * de um "kkkk" animado não se justifica.
 */
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

async function buscar(caminho: string, params: Record<string, string>) {
  if (!env.KLIPY_API_KEY) {
    throw new AppError("A busca de GIF precisa de uma chave da KLIPY no .env (KLIPY_API_KEY)", 503);
  }

  const chaveCache = `${caminho}?${new URLSearchParams(params)}`;
  const guardado = cache.get(chaveCache);
  if (guardado && Date.now() - guardado.em < CACHE_MS) return guardado.dados;

  const url = new URL(`${BASE}/${caminho}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", env.KLIPY_API_KEY);
  url.searchParams.set("client_key", "gravae-chat");
  url.searchParams.set("media_filter", "webp,gif,mediumgif,tinygif,nanogif");
  url.searchParams.set("country", "BR");
  url.searchParams.set("locale", "pt_BR");

  const resposta = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!resposta.ok) throw new AppError("O serviço de GIF não respondeu agora", 502);

  const dados = converter((await resposta.json()) as RespostaGif);
  cache.set(chaveCache, { em: Date.now(), dados });

  return dados;
}

export const gifService = {
  disponivel: () => Boolean(env.KLIPY_API_KEY),

  buscar: (q: string, limit = 30) => buscar("search", { q, limit: String(limit) }),
  emAlta: (limit = 30) => buscar("featured", { limit: String(limit) }),
};
