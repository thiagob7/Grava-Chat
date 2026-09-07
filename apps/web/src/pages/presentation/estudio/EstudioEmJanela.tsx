import React, { useEffect } from "react";

import { CorpoDoEstudio } from "~/features/configuracoes/components/estudio/EstudioDeTemas";
import { FixarPorCima } from "~/features/configuracoes/components/estudio/FixarPorCima";
import { ehDesktop } from "~/lib/desktop";

/*
  O estúdio numa janela só dele.

  A janela compartilha o localStorage com a do app, e a store escuta o evento
  de storage: o que se digita aqui pinta lá atrás na hora. É por isso que a
  janela existe — dentro do modal a pessoa escreve tema sem ver o tema.
*/
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
      {/*
        No aplicativo de mesa a janela é nossa: a faixa de cima é a alça para
        arrastar — no macOS ela também é onde moram as bolinhas do sistema — e
        no canto direito fica o alfinete. No navegador nada disso existe.
      */}
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
