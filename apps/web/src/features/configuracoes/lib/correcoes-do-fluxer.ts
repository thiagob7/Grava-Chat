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

/*
  A faixa do usuário mede trilho mais lateral. O tema faz essa soma com o valor
  de fábrica da lateral, e aqui a lateral é arrastável — então a soma dele fica
  curta assim que alguém arrasta. 100% aqui é a lateral de verdade.
*/
.area-do-usuario {
  width: calc(100% + var(--layout-guild-list-width)) !important;
}

/*
  A janela do estúdio dentro do app não veste o tema.

  Na janela do sistema isso sai de graça, porque ela é outro documento. Aqui ela
  divide o documento com o app, então o tema alcança os botões e os campos dela
  pelos nomes que a ponte empresta. Um tema que esconde botão esconderia
  justamente o de desfazer.
*/
.janela-neutra,
.janela-neutra * {
  backdrop-filter: none !important;
}

.janela-neutra [class*="Button.module__secondary_"],
.janela-neutra [class*="Input.module__input_"] {
  background: var(--color-surface-3) !important;
  border-color: var(--color-line) !important;
}


`;

/// Marcas de que o CSS foi escrito para a árvore do Fluxer.
const SINAIS = ["data-flx", ".module__", "--Theme", "fluxer"];

export function pareceTemaDoFluxer(css: string) {
  return SINAIS.some((sinal) => css.includes(sinal));
}
