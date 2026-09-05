import React from "react";

import { JanelaFlutuante } from "~/components/ui/janela-flutuante";
import { CorpoDoEstudio } from "~/features/configuracoes/components/estudio/EstudioDeTemas";
import { useJanelaDoEstudio } from "~/features/configuracoes/stores/janela-do-estudio";

/// Montado uma vez, no nível do app: sobrevive a fechar as configurações.
export const JanelaDoEstudio: React.FC = () => {
  const aberto = useJanelaDoEstudio((s) => s.aberto);
  const fechar = useJanelaDoEstudio((s) => s.fechar);

  return (
    <JanelaFlutuante data-gc="configuracoes.estudio.janela-do-estudio.janela-flutuante.fechar" id="estudio" titulo="Estúdio de temas" aberto={aberto} onFechar={fechar}>
      <CorpoDoEstudio data-gc="configuracoes.estudio.janela-do-estudio.corpo-do-estudio" />
    </JanelaFlutuante>
  );
};
