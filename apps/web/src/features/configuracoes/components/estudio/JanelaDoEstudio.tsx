import React from "react";

import { FloatingWindow } from "~/components/ui/floating-window";
import { StudioBody } from "~/features/configuracoes/components/estudio/EstudioDeTemas";
import { useStudioWindow } from "~/features/configuracoes/stores/janela-do-estudio";

export const StudioWindow: React.FC = () => {
  const isOpen = useStudioWindow((s) => s.isOpen);
  const close = useStudioWindow((s) => s.close);

  return (
    <FloatingWindow data-gc="configuracoes.estudio.janela-do-estudio.floating-window.close" id="estudio" title="Estúdio de temas" open={isOpen} onClose={close}>
      <StudioBody data-gc="configuracoes.estudio.janela-do-estudio.studio-body" />
    </FloatingWindow>
  );
};
