/// Comentário de CSS que fecha e reabre errado.
///
/// No CSS, um comentário abre com barra-asterisco e fecha com
/// asterisco-barra. Quando alguém escreve o fecha e emenda outro asterisco
/// logo em seguida — o padrão que este arquivo procura — o primeiro fecha já
/// encerrou o comentário, e o pedaço que sobra cai dentro do bloco como lixo.
///
/// Aí o navegador faz o que manda a regra: descarta a declaração ruim até o
/// próximo ponto e vírgula, e leva junto a declaração seguinte, que estava
/// inteira.
///
/// É um erro de digitação invisível: o editor pinta tudo como comentário, e a
/// variável simplesmente não vale. Num tema, isso vira "importei e metade não
/// pegou".

const QUEBRA = /\*\/\*(?:(?!\*\/)[\s\S])*\*\//g;

export interface Engolida {
  /// A variável que o navegador descarta junto com o lixo.
  variavel: string | null;
  /// A linha onde o comentário quebra, para a pessoa achar no editor.
  linha: number;
}

export function acharComentariosQuebrados(css: string): Engolida[] {
  const achados: Engolida[] = [];

  for (const quebra of css.matchAll(QUEBRA)) {
    const inicio = quebra.index ?? 0;

    const seguinte = /\s*(--[A-Za-z0-9_-]+)\s*:/.exec(css.slice(inicio + quebra[0].length));

    achados.push({
      variavel: seguinte?.[1] ?? null,
      linha: css.slice(0, inicio).split("\n").length,
    });
  }

  return achados;
}

/// Tira só o lixo e devolve o fecha que o comentário de cima precisa. Não mexe
/// em mais nada: o resto do arquivo é de quem escreveu.
export function consertarComentariosQuebrados(css: string): string {
  return css.replace(QUEBRA, "*/");
}
