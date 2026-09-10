import React from "react";

/*
  A alça de largura mora AQUI, e não dentro da coluna de conversas.

  Dentro dela a alça nascia depois do cabeçalho e morria antes do rodapé: o
  contêiner que a segurava começa abaixo do título e tem recorte, então metade
  da borda ficava fora do alcance do ponteiro. Pendurada na coluna inteira, ela
  vai do topo até embaixo, passando pelo cartão do usuário — que é onde a borda
  realmente termina.
*/
export const ColunaDaEsquerda: React.FC<{
  rodape: React.ReactNode;
  alca?: React.ReactNode;
  children: React.ReactNode;
}> = ({ rodape, alca, children }) => (
  <div data-gc="app.coluna-da-esquerda.div" className="relative flex min-h-0 shrink-0 flex-col">
    <div data-gc="app.coluna-da-esquerda.div--2" className="flex min-h-0 flex-1 bg-surface-1">{children}</div>
    {rodape}
    {alca}
  </div>
);
