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
  A área do usuário já atravessa trilho e lateral, então a largura do tema
  cabe. Só não pode passar da borda direita da lateral: o tema soma a folga
  entre painéis, que aqui não existe.
*/
.area-do-usuario {
  max-width: calc(100% + var(--layout-guild-list-width)) !important;
}

/*
  A caixa de escrever flutua sobre as mensagens em vez de ficar ao lado delas.
  Sem recortar, o painel das mensagens ia até embaixo e passava por trás da
  caixa. A segunda regra tira o respiro que o rodapé flutuante reservava, que
  agora sobraria.
*/
.lista-de-mensagens {
  max-height: calc(100% - var(--gc-rodape, 0px)) !important;
}

.lista-de-mensagens > * {
  --gc-rodape: 0px;
}
`;

/// Marcas de que o CSS foi escrito para a árvore do Fluxer.
const SINAIS = ["data-flx", ".module__", "--Theme", "fluxer"];

export function pareceTemaDoFluxer(css: string) {
  return SINAIS.some((sinal) => css.includes(sinal));
}
