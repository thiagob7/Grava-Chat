import React, { useCallback, useRef } from "react";
import type { Patente } from "@gravae/shared";

import { usarLottie } from "~/lib/cosmeticos/lottie";
import { carregarPatente, ehPatenteComArte, proporcaoDaPatente } from "~/lib/cosmeticos/patentes";
import { PATENTES_DE_PERFIL } from "~/lib/cosmeticos/catalogo";

interface PatenteAnimadaProps {
  patente: Patente;
  animar: boolean;
  altura?: number;
}

export const PatenteAnimada: React.FC<PatenteAnimadaProps> = ({
  patente,
  animar,
  altura = 20,
}) => {
  const caixa = useRef<HTMLSpanElement>(null);

  usarLottie(caixa, {
    chave: patente,
    carregar: useCallback(() => carregarPatente(patente), [patente]),
    animar,
    repetir: false,
  });

  if (!ehPatenteComArte(patente)) return null;

  const rotulo = PATENTES_DE_PERFIL.find((o) => o.id === patente)?.rotulo ?? patente;

  return (
    <span
      ref={caixa}
      role="img"
      aria-label={rotulo}
      title={rotulo}
      className="inline-block shrink-0 align-middle"
      style={{ height: altura, width: Math.round(altura * proporcaoDaPatente(patente)) }}
    />
  );
};
