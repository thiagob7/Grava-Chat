/*
  O que o build de quem escreveu deixou datado, e quando desfazer isso.

  Duas coisas num tema da comunidade envelhecem, e as duas apontam para o
  cliente em que ele foi escrito:

    - o hash no nome da classe, `.GuildNavbar\.module__guildNavbarContainer___XzY3N2`,
      que muda a cada build deles;
    - o `div` na frente de `div[class*="…"]`, posto quando aquele elemento
      ainda era um div — hoje vários são `<section>` e `<aside>`.

  Por padrão a gente NÃO desfaz nada: o arquivo entra como está, igual ao
  `useCustomThemeStyle` da referência. Foi a lição de um dia inteiro de comparação
  lado a lado — quem importa um tema quer ver aqui o que vê lá, e traduzir fazia
  o Galaxy pintar painel com contorno e canto de 24px que na referência de hoje não
  aparece. "Está diferente da referência" não tinha resposta; "este tema antigo não
  pega" tem, e está no painel do estúdio com número.

  Quem quiser o tema como o autor desenhou desliga o "à risca" naquele tema. Aí
  estas duas traduções entram — e é o que faz um tema da comunidade, com 621 das suas 650
  regras presas a hash, sair da fonte e virar tema.

  A conta que decide, por tema:

      Galaxy Edition     21 com `div`,   6 presas ao hash
      um tema da comunidade           0 com `div`, 621 presas ao hash
      Quiet Gruvbox       0 com `div`,   3 presas ao hash
*/

const TRAVADO = /\.([A-Za-z][A-Za-z0-9]*)\\\.module__([A-Za-z0-9]+)___[A-Za-z0-9]+/g;

/*
  O `div` na frente do seletor.

  Muito tema escreve `div[class*="MemberListContainer"]`. O `div` não está ali
  por querer um div: está porque, no build contra o qual a pessoa escreveu,
  aquele elemento era um. A referência depois trocou por `<section>` e `<aside>` —
  nós usamos as mesmas tags de hoje, então esses seletores morrem aqui e lá
  pela mesma razão.

  Só que é a MESMA razão que mata o seletor preso ao hash. Honrar a tag antiga
  e traduzir o hash antigo era escolher os dois lados: no Galaxy, a lateral
  voltava a brilhar (hash traduzido) e o painel de mensagens não (tag honrada),
  e o resultado parecia defeito — porque era. Ou revive o tema inteiro, ou
  nenhum pedaço dele.

  Então o `div` sai junto com o hash, sob a mesma chave. Só ele:
  `button[class*=…]` quer um botão de verdade, e o nosso botão é `<button>`.
*/
const DIV_NA_FRENTE = /\bdiv(?=\[class\*=)/g;

/*
  Reescreve o que o build de quem escreveu deixou datado — o hash e a tag.

  Com a chave "à risca" ligada nada disso acontece e o arquivo entra cru, que é
  o que a referência faz. Desligada (o padrão), o tema volta a fazer o que o autor
  desenhou.
*/
export function traduzirSeletoresTravados(css: string): string {
  return css
    .replace(
      TRAVADO,
      (_, arquivo: string, parte: string) => `[class*="${arquivo}.module__${parte}_"]`,
    )
    .replace(DIV_NA_FRENTE, "");
}

/*
  O que a chave "à risca" liga e desliga, em número.

  São duas coisas datadas, e cada tema pende para um lado: o Galaxy tem 21
  seletores com `div` na frente e 6 presos a hash; um tema da comunidade tem 0 e 621. É
  esse par que o estúdio mostra, porque é ele que diz o custo da chave ali.
*/
/*
  Quando aplicar o arquivo como está deixaria o tema sem nada.

  Um seletor preso ao hash — `.X\.module__y___XzY3N2` — está morto em todo
  lugar que não seja o build exato de quem escreveu. Não é "não pega aqui": não
  pega em referência nenhuma recompilado desde então. Um tema feito só disso, aplicado
  à risca, não é o tema: é uma folha em branco.

  A conta separa os três casos que temos em mãos sem ambiguidade:

      Galaxy Edition      5 presos de  31 seletores →  16%
      Quiet Gruvbox       3 presos de 160 seletores →   2%
      um tema da comunidade         158 presos de 178 seletores →  89%

  Abaixo do corte, o arquivo entra como está e o tema aparece aqui como aparece
  na referência — que é o que se espera de um tema importado. Acima, traduzir é a
  única leitura que sobra, porque a outra não mostra nada.

  Setenta por cento é folgado dos dois lados: o mais alto dos que ficam de fora
  tem 16%, o mais baixo dos que entram tem 89%.
*/
const QUASE_SO_HASH = 0.7;

export function deveTraduzir(css: string): boolean {
  const { presos, soltos } = contarSeletoresDatados(css);
  const total = presos + soltos;

  return total > 0 && presos / total >= QUASE_SO_HASH;
}

export function contarSeletoresDatados(css: string): {
  presos: number;
  comDiv: number;
  soltos: number;
} {
  return {
    presos: new Set(css.match(TRAVADO) ?? []).size,
    comDiv: new Set(css.match(/\bdiv\[class\*="[^"]+"\]/g) ?? []).size,
    soltos: new Set(css.match(/\[class\*="[^"]+"\]/g) ?? []).size,
  };
}


/*
  As classes de tema da raiz.

  Eles marcam a raiz com `theme-dark`, `theme-light`, `theme-coal`; aqui a
  marca é `data-tema`. Um tema que avisa "só funciona no escuro" fala por essas
  classes, então a raiz passa a carregar as duas marcas.
*/
export const CLASSE_DO_TEMA: Record<string, string> = {
  escuro: "theme-dark",
  "mais-escuro": "theme-coal",
  claro: "theme-light",
  gravae: "theme-dark",
};

export function marcarTemaDaRaiz(tema: string | undefined) {
  const raiz = document.documentElement;

  for (const classe of Object.values(CLASSE_DO_TEMA)) raiz.classList.remove(classe);

  const escolhida = CLASSE_DO_TEMA[tema ?? ""] ?? CLASSE_DO_TEMA.escuro;
  if (escolhida) raiz.classList.add(escolhida);
}
