import React, { useMemo } from "react";

import { useAppearance } from "~/features/configuracoes/stores/aparencia";

const PIECES = 90;
const COLORS = ["#5865f2", "#eb459e", "#faa61a", "#3ba55c", "#00a8fc", "#ed4245", "#ffffff"];

/*
  Papel picado para o momento em que algo dá certo. Cai de cima da tela, deriva
  para os lados e some embaixo.

  Cada pedaço nasce com números sorteados uma vez só, presos num `useMemo`:
  sorteando a cada renderização, a chuva inteira saltava de lugar sempre que
  qualquer estado do modal mudasse.

  Quem pediu menos animação não vê nada — é enfeite, e enfeite é a primeira
  coisa que sai quando a pessoa avisa que incomoda.
*/
export const Confetti: React.FC<{ playing: boolean }> = ({ playing }) => {
  const stillImage = useAppearance((state) => state.reduceAnimation);

  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        key: i,
        left: Math.random() * 100,
        drift: Math.round((Math.random() - 0.5) * 240),
        turn: Math.round(360 + Math.random() * 720),
        delay: Math.random() * 0.8,
        time: 2.4 + Math.random() * 1.6,
        width: 6 + Math.round(Math.random() * 5),
        height: 9 + Math.round(Math.random() * 7),
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.7,
      })),
    [],
  );

  if (!playing || stillImage) return null;

  return (
    <div data-gc="confete.div" aria-hidden className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      {pieces.map((piece) => (
        <span data-gc="confete.span"
          key={piece.key}
          className="confete absolute top-0 block"
          style={{
            left: `${piece.left}%`,
            width: piece.width,
            height: piece.height,
            background: piece.color,
            borderRadius: piece.round ? "9999px" : "1px",
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.time}s`,
            "--deriva": `${piece.drift}px`,
            "--giro": `${piece.turn}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
