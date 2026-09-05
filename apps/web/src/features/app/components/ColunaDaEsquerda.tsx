import React from "react";

/*
  Trilho, lateral e rodapé, na relação que o Fluxer usa.

  O rodapé era filho da lateral, e por isso a borda que um tema desenha na
  lateral descia e cercava o usuário junto — enquanto o trilho, que é irmão,
  corria por trás dele. Nenhum ajuste de altura conserta isso: era a árvore
  que estava errada.

  Aqui o trilho e a lateral dividem uma linha, e o rodapé é irmão dessa linha.
  Os dois terminam onde o rodapé começa porque não têm para onde crescer, sem
  precisar de conta nenhuma.
*/
export const ColunaDaEsquerda: React.FC<{
  rodape: React.ReactNode;
  children: React.ReactNode;
}> = ({ rodape, children }) => (
  <div data-gc="app.coluna-da-esquerda.div" className="flex min-h-0 shrink-0 flex-col">
    <div data-gc="app.coluna-da-esquerda.div--2" className="flex min-h-0 flex-1">{children}</div>
    {rodape}
  </div>
);
