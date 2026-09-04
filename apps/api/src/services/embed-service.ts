import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export interface Embed {
  url: string;
  tipo: "link" | "video" | "imagem";
  site: string | null;
  titulo: string | null;
  descricao: string | null;
  imagem: string | null;
  favicon: string | null;
  autor: string | null;
  player: string | null;
  cor: string | null;
  largura: number | null;
  altura: number | null;
}

const TEMPO_LIMITE = 6_000;
const MAXIMO_DE_BYTES = 768 * 1024;
const CACHE_MS = 30 * 60_000;
const CACHE_FALHA_MS = 5 * 60_000;
const CACHE_MAXIMO = 500;

const UA = "Mozilla/5.0 (compatible; GravaeBot/1.0; +https://gravae.io)";

const cache = new Map<string, { em: number; ate: number; valor: Embed | null }>();

function enderecoPrivado(ip: string): boolean {
  if (ip.includes(":")) {
    const baixo = ip.toLowerCase();
    if (baixo.startsWith("::ffff:")) return enderecoPrivado(baixo.slice(7));
    return (
      baixo === "::1" ||
      baixo === "::" ||
      baixo.startsWith("fc") ||
      baixo.startsWith("fd") ||
      baixo.startsWith("fe80")
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

async function podeBuscar(alvo: URL): Promise<boolean> {
  if (alvo.protocol !== "http:" && alvo.protocol !== "https:") return false;

  const host = alvo.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) return !enderecoPrivado(host);

  return lookup(host, { all: true })
    .then((achados) => achados.length > 0 && achados.every(({ address }) => !enderecoPrivado(address)))
    /// Nome que não resolve não é buscável — e não é erro nosso.
    .catch(() => false);
}

async function buscar(url: string, accept: string) {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE);

  return fetch(url, {
    signal: controle.signal,
    redirect: "follow",
    headers: { "user-agent": UA, accept, "accept-language": "pt-BR,pt;q=0.9,en;q=0.8" },
  }).finally(() => clearTimeout(relogio));
}

async function lerInicio(resposta: Response): Promise<string> {
  const leitor = resposta.body?.getReader();
  if (!leitor) return "";

  const decodificador = new TextDecoder("utf-8");
  let texto = "";
  let lidos = 0;

  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;

    lidos += value.length;
    texto += decodificador.decode(value, { stream: true });

    const jaTemOQuePrecisa = /og:(title|description|image)/i.test(texto) && /<\/head>/i.test(texto);

    if (lidos >= MAXIMO_DE_BYTES || jaTemOQuePrecisa) {
      await leitor.cancel().catch(() => undefined);
      break;
    }
  }

  return texto;
}

const ENTIDADES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#39": "'",
  "#x27": "'",
  "#x2F": "/",
};

const desescapar = (texto: string) =>
  texto.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (inteiro, nome: string) => {
    const conhecida = ENTIDADES[nome] ?? ENTIDADES[nome.toLowerCase()];
    if (conhecida) return conhecida;

    const numero = /^#x/i.test(nome)
      ? Number.parseInt(nome.slice(2), 16)
      : /^#/.test(nome)
        ? Number.parseInt(nome.slice(1), 10)
        : NaN;

    return Number.isFinite(numero) ? String.fromCodePoint(numero) : inteiro;
  });

const atributo = (tag: string, nome: string) =>
  new RegExp(`${nome}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i")
    .exec(tag)
    ?.slice(2)
    .find((v) => v !== undefined) ?? null;

function metatags(html: string): Map<string, string> {
  const achadas = new Map<string, string>();

  for (const [tag] of html.matchAll(/<meta\s[^>]*>/gi)) {
    const chave = atributo(tag, "property") ?? atributo(tag, "name") ?? atributo(tag, "itemprop");
    const valor = atributo(tag, "content");
    if (!chave || !valor) continue;

    const nome = chave.trim().toLowerCase();
    if (!achadas.has(nome)) achadas.set(nome, desescapar(valor.trim()));
  }

  return achadas;
}

function iconeDaPagina(html: string, base: URL): string | null {
  for (const [tag] of html.matchAll(/<link\s[^>]*>/gi)) {
    const rel = atributo(tag, "rel")?.toLowerCase() ?? "";
    if (!/\bicon\b/.test(rel)) continue;

    const href = atributo(tag, "href");
    if (href) return absoluto(desescapar(href), base);
  }

  return `${base.origin}/favicon.ico`;
}

const absoluto = (endereco: string, base: URL): string | null => {
  try {
    return new URL(endereco, base).toString();
  } catch {
    return null;
  }
};

const numero = (valor: string | undefined) => {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

function corDoTema(valor: string | null): string | null {
  const cor = valor?.trim();
  if (!cor || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(cor)) return null;

  const cheio =
    cor.length === 4
      ? `#${cor[1]}${cor[1]}${cor[2]}${cor[2]}${cor[3]}${cor[3]}`
      : cor;

  const canal = (inicio: number) => {
    const bruto = Number.parseInt(cheio.slice(inicio, inicio + 2), 16) / 255;
    return bruto <= 0.03928 ? bruto / 12.92 : ((bruto + 0.055) / 1.055) ** 2.4;
  };

  const luminancia = 0.2126 * canal(1) + 0.7152 * canal(3) + 0.0722 * canal(5);

  return luminancia >= 0.05 ? cheio : null;
}

const VIDEO_DO_YOUTUBE =
  /^https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{6,20})/i;

async function doYouTube(url: string, id: string): Promise<Embed | null> {
  const oembed = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${id}`,
  )}`;

  const dados = await buscar(oembed, "application/json")
    .then((r) => (r.ok ? (r.json() as Promise<Record<string, unknown>>) : null))
    .catch(() => null);

  if (!dados) return null;

  const texto = (chave: string) =>
    typeof dados[chave] === "string" ? (dados[chave] as string) : null;

  return {
    url,
    tipo: "video",
    site: "YouTube",
    titulo: texto("title"),
    descricao: null,
    imagem: texto("thumbnail_url") ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    favicon: "https://www.youtube.com/favicon.ico",
    autor: texto("author_name"),
    player: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
    cor: "#ff0000",
    largura: numero(String(dados.thumbnail_width)) ?? 480,
    altura: numero(String(dados.thumbnail_height)) ?? 360,
  };
}

async function montar(url: string): Promise<Embed | null> {
  let alvo: URL;
  try {
    alvo = new URL(url);
  } catch {
    return null;
  }

  if (!(await podeBuscar(alvo))) return null;

  const doTubo = VIDEO_DO_YOUTUBE.exec(url);
  if (doTubo?.[1]) return doVideoDoYouTube(url, doTubo[1], alvo);

  return cartaoDaPagina(url, alvo);
}

async function cartaoDaPagina(url: string, alvo: URL): Promise<Embed | null> {
  const resposta = await buscar(url, "text/html,application/xhtml+xml").catch(() => null);
  if (!resposta?.ok) return null;

  const tipoDeConteudo = resposta.headers.get("content-type") ?? "";

  if (tipoDeConteudo.startsWith("image/")) {
    await resposta.body?.cancel().catch(() => undefined);
    return {
      url,
      tipo: "imagem",
      site: alvo.hostname.replace(/^www\./, ""),
      titulo: null,
      descricao: null,
      imagem: url,
      favicon: `${alvo.origin}/favicon.ico`,
      autor: null,
      player: null,
      cor: null,
      largura: null,
      altura: null,
    };
  }

  if (!tipoDeConteudo.includes("html")) {
    await resposta.body?.cancel().catch(() => undefined);
    return null;
  }

  const html = await lerInicio(resposta);
  const meta = metatags(html);
  const base = new URL(resposta.url || url);

  const primeiro = (...chaves: string[]) => {
    for (const chave of chaves) {
      const valor = meta.get(chave);
      if (valor) return valor;
    }
    return null;
  };

  const tituloDaTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  const titulo =
    primeiro("og:title", "twitter:title") ??
    (tituloDaTag ? desescapar(tituloDaTag.trim()) : null);

  const imagem = primeiro("og:image:secure_url", "og:image:url", "og:image", "twitter:image", "twitter:image:src");
  const player = primeiro("og:video:secure_url", "og:video:url", "og:video", "twitter:player");
  const descricao = primeiro("og:description", "twitter:description", "description");

  if (!titulo && !descricao && !imagem) return null;

  return {
    url,
    tipo: player ? "video" : "link",
    site: primeiro("og:site_name", "application-name") ?? base.hostname.replace(/^www\./, ""),
    titulo,
    descricao,
    imagem: imagem ? absoluto(imagem, base) : null,
    favicon: iconeDaPagina(html, base),
    autor: primeiro("article:author", "twitter:creator", "author"),
    player: player ? absoluto(player, base) : null,
    cor: corDoTema(primeiro("theme-color", "msapplication-TileColor")),
    largura: numero(primeiro("og:image:width") ?? undefined),
    altura: numero(primeiro("og:image:height") ?? undefined),
  };
}

async function doVideoDoYouTube(url: string, id: string, alvo: URL): Promise<Embed | null> {
  const porOembed = await doYouTube(url, id);
  if (porOembed) return porOembed;

  const pagina = await cartaoDaPagina(url, alvo);
  if (!pagina?.titulo || !pagina.imagem) return null;

  return {
    ...pagina,
    site: "YouTube",
    tipo: "video",
    player: null,
    imagem: pagina.imagem ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

function guardar(url: string, valor: Embed | null) {
  if (cache.size >= CACHE_MAXIMO) {
    const maisVelho = [...cache.entries()].reduce((a, b) => (a[1].em <= b[1].em ? a : b));
    cache.delete(maisVelho[0]);
  }

  cache.set(url, { em: Date.now(), ate: Date.now() + (valor ? CACHE_MS : CACHE_FALHA_MS), valor });
}

const emVoo = new Map<string, Promise<Embed | null>>();

export const embedService = {
  async resolver(url: string): Promise<Embed | null> {
    const guardado = cache.get(url);
    if (guardado && guardado.ate > Date.now()) return guardado.valor;

    const jaPedido = emVoo.get(url);
    if (jaPedido) return jaPedido;

    const pedido = montar(url)
      .catch(() => null)
      .then((valor) => {
        guardar(url, valor);
        return valor;
      })
      .finally(() => emVoo.delete(url));

    emVoo.set(url, pedido);
    return pedido;
  },
};
