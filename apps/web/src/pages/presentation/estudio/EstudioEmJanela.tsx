import React, { useEffect } from "react";

import { CorpoDoEstudio } from "~/features/configuracoes/components/estudio/EstudioDeTemas";
import { FixarPorCima } from "~/features/configuracoes/components/estudio/FixarPorCima";
import { ehDesktop } from "~/lib/desktop";

export const EstudioEmJanela: React.FC = () => {
  useEffect(() => {
    const antes = document.title;
    document.title = "Estúdio de temas — Gravaê";

    return () => {
      document.title = antes;
    };
  }, []);

  return (
    <div data-gc="estudio.estudio-em-janela.div" className="flex h-full flex-col overflow-hidden bg-surface-2">
      {ehDesktop() && (
        <div data-gc="estudio.estudio-em-janela.div--2" className="regiao-de-arrasto flex h-8 shrink-0 items-center justify-end border-b border-line bg-surface-1 px-2">
          <FixarPorCima data-gc="estudio.estudio-em-janela.fixar-por-cima" />
        </div>
      )}

      <div data-gc="estudio.estudio-em-janela.div--3" className="flex min-h-0 flex-1 overflow-hidden">
        <CorpoDoEstudio data-gc="estudio.estudio-em-janela.corpo-do-estudio" />
      </div>
    </div>
  );
};
