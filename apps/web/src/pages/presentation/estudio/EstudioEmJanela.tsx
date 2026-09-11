import React, { useEffect } from "react";

import { StudioBody } from "~/features/configuracoes/components/estudio/EstudioDeTemas";
import { PinByUp } from "~/features/configuracoes/components/estudio/FixarPorCima";
import { isDesktop } from "~/lib/desktop";

export const StudioInWindow: React.FC = () => {
  useEffect(() => {
    const before = document.title;
    document.title = "Estúdio de temas — Gravaê";

    return () => {
      document.title = before;
    };
  }, []);

  return (
    <div data-gc="estudio.estudio-em-janela.div" className="flex h-full flex-col overflow-hidden bg-surface-2">
      {isDesktop() && (
        <div data-gc="estudio.estudio-em-janela.div--2" className="regiao-de-arrasto flex h-8 shrink-0 items-center justify-end border-b border-line bg-surface-1 px-2">
          <PinByUp data-gc="estudio.estudio-em-janela.pin-by-up" />
        </div>
      )}

      <div data-gc="estudio.estudio-em-janela.div--3" className="flex min-h-0 flex-1 overflow-hidden">
        <StudioBody data-gc="estudio.estudio-em-janela.studio-body" />
      </div>
    </div>
  );
};
