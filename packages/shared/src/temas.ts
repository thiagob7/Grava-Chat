export interface CabecalhoDoTema {
  nome: string | null;
  descricao: string | null;
  autor: string | null;
  versao: string | null;
  tags: string[];
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

/// Lê o bloco `/** @name ... */` do topo do CSS, no mesmo formato que o
/// Fluxer e o BetterDiscord usam. Sem o bloco, devolve tudo vazio — o CSS
/// continua valendo, só não se apresenta.
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

/// Monta o bloco de volta, para o arquivo que sai no "Exportar".
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

/// Troca o cabeçalho existente por um novo, sem duplicar o bloco.
export function comCabecalho(css: string, cabecalho: CabecalhoDoTema): string {
  const corpo = css.replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, "");
  const bloco = escreverCabecalhoDoTema(cabecalho);

  return bloco ? `${bloco}\n\n${corpo}` : corpo;
}

/// O caminho de um tema publicado. Uma mensagem que traga este link vira o
/// cartão de "Tema compartilhado" em vez da prévia de link de sempre.
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
