import React from "react";

import { flx } from "~/lib/compat-de-tema";

export const AreaDeConversa: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-gc="conversa.area-de-conversa.div" className="flex min-h-0 flex-1 flex-col">
    {children}
  </div>
);

export const PainelDaConversa: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <section
    data-gc="conversa.area-de-conversa.section"
    aria-label="Mensagens"
    {...flx("areaDeMensagens", "area-de-conversa relative flex min-h-0 flex-1 flex-col")}
  >
    {children}
  </section>
);

export const RodapeDaConversa: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-gc="conversa.area-de-conversa.div--2" className="relative z-10 shrink-0">
    {children}
  </div>
);
