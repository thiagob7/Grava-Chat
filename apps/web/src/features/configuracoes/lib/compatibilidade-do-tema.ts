import { LUGARES } from "~/lib/compat-fluxer";

/*
  O que um tema do Fluxer procura, e o que ele acha aqui.

  "Está quase igual mas não está" é impossível de resolver no olho: o tema tem
  centenas de seletores e a diferença mora em três ou quatro que não acham nada.
  Então em vez de comparar print, a gente pergunta ao próprio CSS: quais nomes
  ele mira, e quais desses existem na nossa árvore.

  O que sobra na lista de faltando é a lista de trabalho.
*/

export interface Compatibilidade {
  /// Nomes do Fluxer que o tema mira e que existem aqui.
  achados: string[];
  /// Os que não existem — cada um é um pedaço do tema sem efeito.
  faltando: string[];
}

const nomesQueTemos = () => {
  const todos = new Set<string>();

  for (const lugar of Object.values(LUGARES)) {
    for (const classe of lugar.classes as readonly string[]) todos.add(classe);
    if ("flx" in lugar) todos.add(lugar.flx);
  }

  return todos;
};

/*
  O tema escreve `[class*="GuildNavbar.module__x_"]`, e a nossa classe é
  `GuildNavbar.module__x_gc`. Casar é perguntar se alguma das nossas começa com
  o que ele pediu — que é exatamente o que o navegador faz com o `*=`.
*/
export function conferirCompatibilidade(css: string): Compatibilidade {
  const nossos = nomesQueTemos();

  const pedidos = new Set<string>();

  for (const achado of css.matchAll(/\[class\*=["']([^"']+)["']\]/g)) {
    if (achado[1]) pedidos.add(achado[1]);
  }

  for (const achado of css.matchAll(/\[data-flx=["']([^"']+)["']\]/g)) {
    if (achado[1]) pedidos.add(achado[1]);
  }

  const achados: string[] = [];
  const faltando: string[] = [];

  for (const pedido of [...pedidos].sort()) {
    const temos = [...nossos].some((nosso) => nosso.includes(pedido));

    (temos ? achados : faltando).push(pedido);
  }

  return { achados, faltando };
}
