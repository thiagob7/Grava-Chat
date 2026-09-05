import React from "react";

import { flx } from "~/lib/compat-fluxer";

/*
  A conversa e a caixa de escrever, uma acima da outra.

  A caixa já flutuou por cima das mensagens, e a lista compensava com um respiro
  embaixo do tamanho dela, medido por um observador. Dava a impressão certa e
  custava caro: o painel das mensagens não tinha onde terminar, porque a caixa
  morava dentro dele.

  Agora são irmãs. A lista termina onde a caixa começa, sem conta nenhuma — e a
  bandeja de anexos e o aviso de quem está digitando empurram a conversa para
  cima em vez de cobrir a última mensagem.
*/
export const AreaDeConversa: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-gc="conversa.area-de-conversa.div" className="flex min-h-0 flex-1 flex-col">
    {children}
  </div>
);

/// O painel das mensagens. Quem rola é a lista lá dentro, não ele.
export const PainelDaConversa: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    data-gc="conversa.area-de-conversa.div--2"
    {...flx("areaDeMensagens", "area-de-conversa relative flex min-h-0 flex-1 flex-col")}
  >
    {children}
  </div>
);

export const RodapeDaConversa: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-gc="conversa.area-de-conversa.div--3" className="relative z-10 shrink-0">
    {children}
  </div>
);
