export interface CabecalhoDoTema {
  nome: string | null;
  descricao: string | null;
  autor: string | null;
  versao: string | null;
  tags: string[];
}

/*
  Um ativo do tema: a imagem que o CSS chama por `gc-ativo("nome")`.

  Ele viaja junto com o tema porque sem isso o tema chega quebrado do outro
  lado: o CSS pede o fundo, não acha nada para resolver, e a pessoa instala um
  tema sem a imagem que era o motivo dele existir.
*/
export interface AtivoDoTema {
  nome: string;
  url: string;
  tipo?: string;
  bytes?: number;
}

export const LIMITE_DE_ATIVOS = 12;

/*
  O peso que a pessoa vê antes de instalar: o CSS mais o que cada imagem pesa.
  Ativo sem tamanho conhecido não some do total, só não soma nada.
*/
export function pesoDoTema(css: string, ativos: AtivoDoTema[] = []): number {
  const doCss = new TextEncoder().encode(css).length;
  return ativos.reduce((total, ativo) => total + (ativo.bytes ?? 0), doCss);
}

export function pesoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface TemaCompartilhado {
  id: string;
  nome: string;
  descricao: string | null;
  autor: string | null;
  versao: string | null;
  tags: string[];
  css: string;
  substituicoes: Record<string, string>;
  ativos: AtivoDoTema[];
  publicadoPor: { id: string; displayName: string; avatarUrl: string | null };
  createdAt: string;
}

export const LIMITES_DO_TEMA = {
  nome: 60,
  descricao: 300,
  autor: 60,
  versao: 20,
  tags: 8,
  tag: 24,
  css: 512 * 1024,
  substituicoes: 600,
};

const VAZIO: CabecalhoDoTema = {
  nome: null,
  descricao: null,
  autor: null,
  versao: null,
  tags: [],
};

const cortar = (valor: string, tamanho: number) => valor.trim().slice(0, tamanho) || null;

export function lerCabecalhoDoTema(css: string): CabecalhoDoTema {
  const bloco = /^\s*\/\*\*([\s\S]*?)\*\//.exec(css);
  if (!bloco?.[1]) return VAZIO;

  const linhas = bloco[1]
    .split("\n")
    .map((linha) => linha.replace(/^\s*\*?\s?/, "").trimEnd())
    .filter(Boolean);

  const campos = new Map<string, string>();

  for (const linha of linhas) {
    const campo = /^@([a-zA-Z]+)\s+(.*)$/.exec(linha);
    if (campo?.[1] && campo[2]) campos.set(campo[1].toLowerCase(), campo[2]);
  }

  const tags = (campos.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim().slice(0, LIMITES_DO_TEMA.tag))
    .filter(Boolean)
    .slice(0, LIMITES_DO_TEMA.tags);

  return {
    nome: cortar(campos.get("name") ?? "", LIMITES_DO_TEMA.nome),
    descricao: cortar(campos.get("description") ?? "", LIMITES_DO_TEMA.descricao),
    autor: cortar(campos.get("author") ?? "", LIMITES_DO_TEMA.autor),
    versao: cortar(campos.get("version") ?? "", LIMITES_DO_TEMA.versao),
    tags,
  };
}

export function escreverCabecalhoDoTema(cabecalho: CabecalhoDoTema): string {
  const linhas = [
    cabecalho.nome && ` * @name ${cabecalho.nome}`,
    cabecalho.descricao && ` * @description ${cabecalho.descricao}`,
    cabecalho.autor && ` * @author ${cabecalho.autor}`,
    cabecalho.versao && ` * @version ${cabecalho.versao}`,
    cabecalho.tags.length > 0 && ` * @tags ${cabecalho.tags.join(", ")}`,
  ].filter(Boolean);

  if (!linhas.length) return "";

  return ["/**", ...linhas, " */"].join("\n");
}

export function comCabecalho(css: string, cabecalho: CabecalhoDoTema): string {
  const corpo = css.replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, "");
  const bloco = escreverCabecalhoDoTema(cabecalho);

  return bloco ? `${bloco}\n\n${corpo}` : corpo;
}

export const CAMINHO_DO_TEMA = "/tema/";

export function idDoTemaNoLink(url: string, origem: string): string | null {
  try {
    const endereco = new URL(url, origem);
    if (endereco.origin !== new URL(origem).origin) return null;

    const encontrado = new RegExp(`^${CAMINHO_DO_TEMA}([a-f\\d]{24})$`, "i").exec(
      endereco.pathname,
    );

    return encontrado?.[1] ?? null;
  } catch {
    return null;
  }
}
