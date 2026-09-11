import React, { Suspense, useEffect } from "react";

const CursorsSection = React.lazy(() =>
  import("~/features/configuracoes/components/CursoresSection").then((m) => ({
    default: m.CursorsSection,
  })),
);

import { PinByUp } from "~/features/configuracoes/components/estudio/FixarPorCima";
import { isDesktop } from "~/lib/desktop";

export const CursorsInWindow: React.FC = () => {
  useEffect(() => {
    const before = document.title;
    document.title = "Cursores — Gravaê";

    return () => {
      document.title = before;
    };
  }, []);

  return (
    <div data-gc="cursores.cursores-em-janela.div" className="flex h-full flex-col overflow-hidden bg-surface-2">
      {isDesktop() && (
        <div data-gc="cursores.cursores-em-janela.div--2" className="regiao-de-arrasto flex h-8 shrink-0 items-center justify-end border-b border-line bg-surface-1 px-2">
          <PinByUp data-gc="cursores.cursores-em-janela.pin-by-up" />
        </div>
      )}

      <div data-gc="cursores.cursores-em-janela.div--3" className="min-h-0 flex-1 overflow-y-auto p-6">
        <CursorsSection data-gc="cursores.cursores-em-janela.cursors-section" />
      </div>
    </div>
  );
};
