import React from "react";

import { cn } from "~/lib/utils";

/*
  A alça de largura mora AQUI, e não dentro da coluna de conversas.

  Dentro dela a alça nascia depois do cabeçalho e morria antes do rodapé: o
  contêiner que a segurava começa abaixo do título e tem recorte, então metade
  da borda ficava fora do alcance do ponteiro. Pendurada na coluna inteira, ela
  vai do topo até embaixo, passando pelo cartão do usuário — que é onde a borda
  realmente termina.
*/
/*
  `fluid` é a gaveta do telefone: lá a coluna precisa CRESCER até a borda. Com
  `shrink-0` e largura automática ela para no tamanho do conteúdo, e sobrava
  uma faixa da conversa aparecendo à direita da gaveta.
*/
export const LeftColumn: React.FC<{
  footer: React.ReactNode;
  alca?: React.ReactNode;
  fluid?: boolean;
  children: React.ReactNode;
}> = ({ footer, alca, fluid = false, children }) => (
  <div data-gc="app.coluna-da-esquerda.div"
    className={cn(
      "relative flex min-h-0 flex-col border-r border-line",
      fluid ? "w-full min-w-0 flex-1" : "shrink-0",
    )}
  >
    <div data-gc="app.coluna-da-esquerda.div--2" className="flex min-h-0 flex-1 bg-surface-1">{children}</div>
    {footer}
    {alca}
  </div>
);
