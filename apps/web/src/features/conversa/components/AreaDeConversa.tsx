import React from "react";

import { flx } from "~/lib/compat-de-tema";

export const ChatArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-gc="conversa.area-de-conversa.div" className="flex min-h-0 flex-1 flex-col">
    {children}
  </div>
);

export const ChatPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <section
    data-gc="conversa.area-de-conversa.section"
    aria-label="Mensagens"
    {...flx("messagesArea", "area-de-conversa relative flex min-h-0 flex-1 flex-col")}
  >
    {children}
  </section>
);

export const ChatFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-gc="conversa.area-de-conversa.div--2" className="relative z-10 shrink-0">
    {children}
  </div>
);
