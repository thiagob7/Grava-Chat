import React, { Suspense, useEffect } from "react";

const CursoresSection = React.lazy(() =>
  import("~/features/configuracoes/components/CursoresSection").then((m) => ({
    default: m.CursoresSection,
  })),
);

import { FixarPorCima } from "~/features/configuracoes/components/estudio/FixarPorCima";
import { ehDesktop } from "~/lib/desktop";

export const CursoresEmJanela: React.FC = () => {
  useEffect(() => {
    const antes = document.title;
    document.title = "Cursores — Gravaê";

    return () => {
      document.title = antes;
    };
  }, []);

  return (
    <div data-gc="cursores.cursores-em-janela.div" className="flex h-full flex-col overflow-hidden bg-surface-2">
      {ehDesktop() && (
        <div data-gc="cursores.cursores-em-janela.div--2" className="regiao-de-arrasto flex h-8 shrink-0 items-center justify-end border-b border-line bg-surface-1 px-2">
          <FixarPorCima data-gc="cursores.cursores-em-janela.fixar-por-cima" />
        </div>
      )}

      <div data-gc="cursores.cursores-em-janela.div--3" className="min-h-0 flex-1 overflow-y-auto p-6">
        <CursoresSection data-gc="cursores.cursores-em-janela.cursores-section" />
      </div>
    </div>
  );
};
