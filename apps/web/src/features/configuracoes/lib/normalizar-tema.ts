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

/*
  As regras que no app da referência já não pegam.

  Um tema é escrito contra um build. Quando eles reescrevem a casca, o nome
  some de lá e a regra morre — e é assim que o Galaxy fica "sutil" no app
  deles: as bordas neon e os painéis de vidro miram `ChannelChatLayout` e
  `MemberListContainer`, que hoje não existem lá. Aqui a gente carrega esses
  nomes de propósito, e as 51 regras pousam, inclusive as 12 que lá estão
  mortas.

  Esta função tira do CSS toda regra cujo alvo é SÓ nome que não existe mais
  lá (módulo de classe, ou área de `data-flx`). Regra sem nome nenhum — `:root`,
  `body`, `@keyframes` — fica. Regra que mira ao menos um nome vivo lá fica.
  É o que faz o tema aqui parecer o tema lá, quando é isso que a pessoa quer.
*/
export interface ExisteNaReferencia {
  modulos: string[];
  areas: string[];
}

export function filtrarRegrasMortas(css: string, existe: ExisteNaReferencia): string {
  const modulos = new Set(existe.modulos);
  const areas = new Set(existe.areas);

  const viva = (seletor: string) => {
    const limpo = seletor.replace(/\\/g, "");
    const nomes: string[] = [];

    for (const [, modulo] of limpo.matchAll(/([A-Za-z][A-Za-z0-9]*)\.module__/g)) nomes.push(`m:${modulo}`);
    for (const [, modulo] of limpo.matchAll(/\[class\*="([A-Za-z][A-Za-z0-9]*)"\]\s*\[class\*="[A-Za-z][A-Za-z0-9]*"\]/g)) nomes.push(`m:${modulo}`);
    for (const [, caminho] of limpo.matchAll(/data-flx\s*=\s*["']([^"']+)["']/g)) nomes.push(`a:${(caminho ?? "").split(".").slice(0, 2).join(".")}`);

    if (!nomes.length) return true;
    return nomes.some((n) => (n.startsWith("m:") ? modulos.has(n.slice(2)) : areas.has(n.slice(2))));
  };

  /*
    Anda pelo texto respeitando chaves aninhadas: um `@media` guarda regras
    inteiras dentro, e um regex plano de `{…}` engoliria o bloco errado.
  */
  let saida = "";
  let i = 0;

  while (i < css.length) {
    const abre = css.indexOf("{", i);
    if (abre === -1) {
      saida += css.slice(i);
      break;
    }

    const seletor = css.slice(i, abre);

    /*
      At-rule com bloco (`@media`, `@supports`, `@container`, `@layer`): copia
      o cabeçalho e desce para dentro, regra a regra. `@keyframes` é o único que
      guarda passos e não regras — vai inteiro, sem olhar.
    */
    const cabecalho = /@([a-z-]+)[^{}]*$/.exec(seletor);
    if (cabecalho) {
      if (cabecalho[1] === "keyframes" || cabecalho[1] === "font-face" || cabecalho[1] === "property") {
        let fundo = 0;
        let fim = abre;
        for (; fim < css.length; fim++) {
          if (css[fim] === "{") fundo++;
          else if (css[fim] === "}" && --fundo === 0) break;
        }
        saida += css.slice(i, fim + 1);
        i = fim + 1;
        continue;
      }

      saida += css.slice(i, abre + 1);
      i = abre + 1;
      continue;
    }

    // o `}` que fecha um at-rule aberto acima volta como está
    if (seletor.includes("}")) {
      const k = seletor.lastIndexOf("}");
      saida += seletor.slice(0, k + 1);
      i += k + 1;
      continue;
    }

    let fundo = 0;
    let fim = abre;
    for (; fim < css.length; fim++) {
      if (css[fim] === "{") fundo++;
      else if (css[fim] === "}" && --fundo === 0) break;
    }

    const corpo = css.slice(abre, fim + 1);
    saida += viva(seletor) ? seletor + corpo : seletor.replace(/[^\n]/g, "");
    i = fim + 1;
  }

  return saida;
}

/// Quantas regras o filtro tiraria — o número que o estúdio mostra ao lado da chave.
export function contarRegrasMortas(css: string, existe: ExisteNaReferencia): number {
  const conta = (texto: string) => (texto.match(/\{[^{}]*:[^{}]*\}/g) ?? []).length;
  return Math.max(0, conta(css) - conta(filtrarRegrasMortas(css, existe)));
}
