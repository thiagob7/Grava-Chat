import React, { useEffect } from "react";

import { CorpoDoEstudio } from "~/features/configuracoes/components/estudio/EstudioDeTemas";

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
    <div data-gc="estudio.estudio-em-janela.div" className="flex h-full overflow-hidden bg-surface-2">
      <CorpoDoEstudio data-gc="estudio.estudio-em-janela.corpo-do-estudio" />
    </div>
  );
};
