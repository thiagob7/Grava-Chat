/*
  A imagem do tema, chamada pelo nome.

  A aba Ativos deixava subir arquivo e devolvia uma URL para colar no CSS. Isso
  serve para quem está escrevendo o tema na própria máquina e não serve para
  mais ninguém: um tema exportado carrega a URL do arquivo de quem o escreveu,
  que some quando aquele endereço sai do ar. E um tema de fora, escrito para
  outro cliente, chama o arquivo por NOME — não tem como saber a nossa URL.

  Então o CSS passa a poder dizer `gc-ativo("fundo")`, e na hora de aplicar a
  gente troca pelo endereço do arquivo que está guardado com esse nome. Quem
  importa o tema sobe a sua própria imagem com o mesmo nome e ela aparece.

  Uma sintaxe só, a nossa. Chegou a aceitar também a de outro cliente, e saiu:
  nenhum tema que temos em mãos usava, e o app não carrega nome de fora.
*/
const CHAMADA = /gc-ativo\(\s*(["']?)([^"')]+)\1\s*\)/g;

export interface AtivoNomeado {
  nome: string;
  url: string;
}

/// "Fundo Da Tela.PNG" e "fundo-da-tela" são o mesmo pedido.
const achatar = (nome: string) =>
  nome
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "");

export interface TemaComAtivos {
  css: string;
  /// Nomes que o CSS pediu e não existem — a aba Ativos mostra a lista.
  faltando: string[];
}

export function resolverAtivos(
  css: string,
  ativos: AtivoNomeado[],
): TemaComAtivos {
  const porNome = new Map<string, string>();

  for (const ativo of ativos) {
    porNome.set(achatar(ativo.nome), ativo.url);
    /// O nome com extensão também vale, para quem copiou o arquivo inteiro.
    porNome.set(ativo.nome.trim().toLowerCase(), ativo.url);
  }

  const faltando = new Set<string>();

  const resolvido = css.replace(CHAMADA, (inteiro, _aspas, pedido: string) => {
    const url =
      porNome.get(pedido.trim().toLowerCase()) ?? porNome.get(achatar(pedido));

    if (!url) {
      faltando.add(pedido.trim());
      /*
        Fica como está de propósito. A declaração inteira vira inválida e o
        navegador a ignora — que é melhor do que pintar por cima com um vazio
        e deixar a pessoa achando que o tema é assim mesmo.
      */
      return inteiro;
    }

    return `url("${url}")`;
  });

  return { css: resolvido, faltando: [...faltando] };
}

/// Quantas vezes o CSS pede um arquivo — a aba mostra o número.
export function contarPedidosDeAtivo(css: string): number {
  return (css.match(CHAMADA) ?? []).length;
}
