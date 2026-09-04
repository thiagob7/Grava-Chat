import { useEffect, useState } from "react";
import type { EstadoDaAtualizacao } from "@gravae/shared";

import { desktop } from "~/lib/desktop";

export function useAtualizacao() {
  const [estado, setEstado] = useState<EstadoDaAtualizacao | null>(null);

  useEffect(() => {
    const ponte = desktop()?.atualizacao;
    if (!ponte) return;

    void ponte.estado().then(setEstado);
    return ponte.aoMudar(setEstado);
  }, []);

  const ponte = desktop()?.atualizacao;

  return {
    estado,
    ponte,
    temNovidade: Boolean(estado?.disponivel) && estado?.fase !== "erro",
    baixando: estado?.fase === "baixando",
    pronta: estado?.fase === "pronta",
    instalando: estado?.fase === "instalando",
  };
}
