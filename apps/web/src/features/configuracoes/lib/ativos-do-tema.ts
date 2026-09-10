const CHAMADA = /gc-ativo\(\s*(["']?)([^"')]+)\1\s*\)/g;

export interface AtivoNomeado {
  nome: string;
  url: string;
}

const achatar = (nome: string) =>
  nome
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "");

export interface TemaComAtivos {
  css: string;
  faltando: string[];
}

export function resolverAtivos(
  css: string,
  ativos: AtivoNomeado[],
): TemaComAtivos {
  const porNome = new Map<string, string>();

  for (const ativo of ativos) {
    porNome.set(achatar(ativo.nome), ativo.url);
    porNome.set(ativo.nome.trim().toLowerCase(), ativo.url);
  }

  const faltando = new Set<string>();

  const resolvido = css.replace(CHAMADA, (inteiro, _aspas, pedido: string) => {
    const url =
      porNome.get(pedido.trim().toLowerCase()) ?? porNome.get(achatar(pedido));

    if (!url) {
      faltando.add(pedido.trim());
      return inteiro;
    }

    return `url("${url}")`;
  });

  return { css: resolvido, faltando: [...faltando] };
}

export function contarPedidosDeAtivo(css: string): number {
  return (css.match(CHAMADA) ?? []).length;
}

/*
  Os nomes que o CSS chama, do jeito que estão escritos. É por essa lista que
  o estúdio decide o que mandar junto quando o tema é publicado.
*/
export function nomesDeAtivosPedidos(css: string): string[] {
  const nomes = new Set<string>();

  for (const [, , pedido] of css.matchAll(CHAMADA)) {
    if (pedido) nomes.add(pedido.trim());
  }

  return [...nomes];
}

export function combinaComPedido(nomeDoArquivo: string, pedido: string): boolean {
  const arquivo = nomeDoArquivo.trim().toLowerCase();
  const pedida = pedido.trim().toLowerCase();

  return arquivo === pedida || achatar(nomeDoArquivo) === achatar(pedido);
}
