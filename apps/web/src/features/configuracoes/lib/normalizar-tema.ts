/*
  Traduz o seletor travado no hash.

  Um tema do Fluxer mira as classes que o build deles gera, e há duas maneiras
  de escrever isso. Umas miram por pedaço:

      [class*="GuildNavbar.module__guildNavbarContainer_"]

  Outras miram a classe inteira, com o hash daquele build junto:

      .GuildNavbar\.module__guildNavbarContainer___XzY3N2

  A primeira forma acha os nossos elementos, porque a ponte carimba
  `GuildNavbar.module__guildNavbarContainer_gc` e o pedaço casa. A segunda
  nunca acha — nem aqui nem num build deles com hash diferente, aliás.

  Então na entrada a gente reescreve a segunda na primeira. O arquivo de quem
  escreveu não muda; muda só o que é aplicado.
*/

const TRAVADO = /\.([A-Za-z][A-Za-z0-9]*)\\\.module__([A-Za-z0-9]+)___[A-Za-z0-9]+/g;

export function normalizarSeletoresDoFluxer(css: string): string {
  return css.replace(TRAVADO, (_, arquivo: string, parte: string) =>
    `[class*="${arquivo}.module__${parte}_"]`,
  );
}

/// Quantos seletores travados o arquivo tem — o estúdio mostra o número.
export function contarSeletoresTravados(css: string): number {
  return new Set(css.match(TRAVADO) ?? []).size;
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
