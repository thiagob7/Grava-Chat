import React, { useCallback, useRef } from "react";
import type { Patente } from "@gravae/shared";

import { usarLottie } from "~/lib/cosmeticos/lottie";
import { carregarPatente, ehPatenteComArte, proporcaoDaPatente } from "~/lib/cosmeticos/patentes";
import { PATENTES_DE_PERFIL } from "~/lib/cosmeticos/catalogo";

interface PatenteAnimadaProps {
  patente: Patente;
  /**
   * Parada em lista, montando no cartão.
   *
   * Aqui isso pesa mais do que na decoração: a patente aparece na linha do
   * nome, e a linha do nome é o lugar do app que mais se repete na tela.
   */
  animar: boolean;
  /**
   * A altura em pixels. A largura sai da proporção da arte.
   *
   * É a altura que se escolhe, e não a largura, porque a insígnia mora numa
   * linha de texto: o que precisa combinar é a altura dela com a das letras ao
   * lado. Padrão 20 — um pouco maior que os 16 do emblema do servidor, que é a
   * diferença de quem diz "eu cheguei aqui" pra quem diz "eu sou daqui".
   */
  altura?: number;
}

/**
 * A insígnia de patente ao lado do nome.
 *
 * Toca UMA VEZ e para: a arte é a insígnia se montando — as peças saem de trás
 * do orbe e assentam. Em laço, isso vira asa atravessando o nome da pessoa a
 * cada oito segundos. É a diferença entre um enfeite que respira (a decoração
 * do avatar) e um que acontece.
 *
 * Devolve `null` pra quem não tem patente, e também pra um id sem arte — assim
 * acrescentar a próxima é só uma entrada em `patentes.ts`.
 */
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
