import React from "react";

export const ColunaDaEsquerda: React.FC<{
  rodape: React.ReactNode;
  children: React.ReactNode;
}> = ({ rodape, children }) => (
  <div data-gc="app.coluna-da-esquerda.div" className="flex min-h-0 shrink-0 flex-col">
    <div data-gc="app.coluna-da-esquerda.div--2" className="flex min-h-0 flex-1">{children}</div>
    {rodape}
  </div>
);
