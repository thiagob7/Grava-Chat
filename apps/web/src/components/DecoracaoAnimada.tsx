import React, { useCallback, useRef } from "react";
import type { Decoracao } from "@gravae/shared";

import {
  carregarDecoracao,
  folgaDaDecoracao,
  segmentoDaDecoracao,
} from "~/lib/cosmeticos/animadas";
import { usarLottie } from "~/lib/cosmeticos/lottie";

interface DecoracaoAnimadaProps {
  decoracao: Decoracao;
  animar: boolean;
}

export const DecoracaoAnimada: React.FC<DecoracaoAnimadaProps> = ({
  decoracao,
  animar,
}) => {
  const caixa = useRef<HTMLSpanElement>(null);

  usarLottie(caixa, {
    chave: decoracao,
    carregar: useCallback(() => carregarDecoracao(decoracao), [decoracao]),
    animar,
    repetir: true,
    segmento: segmentoDaDecoracao(decoracao),
  });

  return (
    <span
      ref={caixa}
      aria-hidden
      className="gc-camada"
      style={{ inset: folgaDaDecoracao(decoracao) }}
    />
  );
};
