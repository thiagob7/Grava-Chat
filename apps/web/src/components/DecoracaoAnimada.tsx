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
  /** parada em lista, andando no cartão — ver `animar` em `lottie.ts` */
  animar: boolean;
}

/**
 * Uma decoração de avatar que é arquivo Lottie, e não CSS.
 *
 * Repete pra sempre: é enfeite de fundo, não evento. O ciclo de vida do player
 * mora em `usarLottie`, dividido com a patente.
 */
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

  /*
    A folga vem do catálogo, e não do CSS: cada arte tem o buraco num tamanho
    diferente, e é ele que precisa casar com a foto.
  */
  return (
    <span
      ref={caixa}
      aria-hidden
      className="gc-camada"
      style={{ inset: folgaDaDecoracao(decoracao) }}
    />
  );
};
