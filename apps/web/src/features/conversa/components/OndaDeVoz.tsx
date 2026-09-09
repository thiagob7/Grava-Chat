import React from "react";

import { BARRAS } from "~/features/conversa/lib/gravador-de-voz";
import { cn } from "~/lib/utils";

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
            "w-[3px] shrink-0 rounded-full transition-colors",
            i < ate ? "bg-brand" : "bg-ink-faint/50",
          )}
          style={{ height: `${Math.max(14, Math.min(1, pico) * 100)}%` }}
        />
      ))}
    </div>
  );
};
