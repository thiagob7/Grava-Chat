import React from "react";

import { BARRAS } from "~/features/conversa/lib/gravador-de-voz";
import { cn } from "~/lib/utils";

/*
  O desenho da onda.

  Serve tanto para quem está gravando quanto para quem ouve depois — a
  diferença é só de onde vêm os picos e quanto já passou. Barra de silêncio
  ainda aparece, com altura mínima: uma fileira com buracos lê como erro de
  carregamento, e não como pausa na fala.
*/
export const OndaDeVoz: React.FC<{
  picos: number[];
  progresso?: number;
  className?: string;
}> = ({ picos, progresso = 0, className }) => {
  const barras = picos.length ? picos.slice(-BARRAS) : new Array(BARRAS).fill(0);
  const ate = Math.round(progresso * barras.length);

  return (
    <div data-gc="conversa.onda-de-voz.div" className={cn("flex h-6 flex-1 items-center gap-px", className)}>
      {barras.map((pico, i) => (
        <span data-gc="conversa.onda-de-voz.span"
          key={i}
          className={cn(
            "flex-1 rounded-full transition-colors",
            i < ate ? "bg-brand" : "bg-ink-faint/40",
          )}
          style={{ height: `${Math.max(10, Math.min(1, pico) * 100)}%` }}
        />
      ))}
    </div>
  );
};
