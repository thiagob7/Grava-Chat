import React from "react";

import { FloatingWindow } from "~/components/ui/floating-window";
import { CorpoDoEstudio } from "~/features/configuracoes/components/estudio/EstudioDeTemas";
import { useJanelaDoEstudio } from "~/features/configuracoes/stores/janela-do-estudio";

export const JanelaDoEstudio: React.FC = () => {
  const aberto = useJanelaDoEstudio((s) => s.aberto);
  const fechar = useJanelaDoEstudio((s) => s.fechar);

  return (
    <FloatingWindow data-gc="configuracoes.estudio.janela-do-estudio.floating-window.fechar" id="estudio" title="Estúdio de temas" open={aberto} onClose={fechar}>
      <CorpoDoEstudio data-gc="configuracoes.estudio.janela-do-estudio.corpo-do-estudio" />
    </FloatingWindow>
  );
};
