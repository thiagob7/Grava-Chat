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
/*
  O trilho é a coluna, e não um rolador dentro dela: a largura é nossa. A
  altura fica com o tema, que é o que encurta trilho e lateral para o rodapé
  caber embaixo em vez de passar por trás deles.
*/
.trilho-de-servidores {
  width: var(--layout-guild-list-width) !important;
}

/*
  O tema encurta os painéis pela altura do rodapé, porque lá o rodapé mora
  dentro deles. Aqui ele mora ao lado: o painel já é flex-1 acima do rodapé e
  para sozinho no lugar certo. Descontar de novo abriria um buraco do tamanho
  do rodapé entre o painel e ele.

  O trilho não entra nesta lista de propósito: nele o desconto é o que faz ele
  terminar em cima do rodapé em vez de correr por trás.
*/
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
