/*
  O que a nossa árvore mede, reafirmado depois do tema.

  Um tema do Fluxer traz, junto com o estilo, um punhado de regras que são
  encanamento da árvore deles: larguras e alturas calculadas para painéis que
  aqui estão em outro lugar. O nome que a gente empresta traz a borda e o rótulo
  que a pessoa quer, e a medida errada de brinde.

  Esta folha entra depois do tema e devolve as medidas que são fato daqui. É
  curta de propósito: cada linha é um caso visto, não precaução. Se um painel
  ficar torto com algum tema, o conserto é uma linha nova aqui.

  Só entra quando o CSS do tema fala a língua deles — tema escrito para o Gravaê
  não paga por isso, e continua mandando na largura de tudo.
*/
export const CORRECOES_DO_FLUXER = `
/* O trilho é a coluna, e não um rolador dentro dela. */
.trilho-de-servidores {
  width: var(--layout-guild-list-width) !important;
  height: auto !important;
}

/* O painel do usuário mora dentro da lateral, e não atravessa trilho e lateral. */
.painel-do-usuario {
  width: auto !important;
  max-width: 100% !important;
}

/* As laterais têm a própria altura; a conta deles sobra do rodapé que não temos. */
.lista-de-canais,
.lista-de-conversas,
.lista-de-comunidades {
  height: 100% !important;
}
`;

/// Marcas de que o CSS foi escrito para a árvore do Fluxer.
const SINAIS = ["data-flx", ".module__", "--Theme", "fluxer"];

export function pareceTemaDoFluxer(css: string) {
  return SINAIS.some((sinal) => css.includes(sinal));
}
