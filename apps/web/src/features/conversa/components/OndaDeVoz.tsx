import React from "react";

import { BARRAS } from "~/features/conversa/lib/gravador-de-voz";
import { cn } from "~/lib/utils";

function neutral() {
  return Array.from({ length: BARRAS }, (_, i) => {
    const wave = Math.sin(i * 0.55) * 0.3 + Math.sin(i * 0.17) * 0.22;
    return 0.5 + wave;
  });
}

export const VoiceWave: React.FC<{
  peaks: number[];
  progress?: number;
  className?: string;
}> = ({ peaks, progress = 0, className }) => {
  const barras = peaks.length ? peaks.slice(-BARRAS) : neutral();
  const until = Math.round(progress * barras.length);

  return (
    <div data-gc="conversa.onda-de-voz.div" className={cn("flex h-6 flex-1 items-center gap-[2px]", className)}>
      {barras.map((pico, i) => (
        <span data-gc="conversa.onda-de-voz.span"
          key={i}
          className={cn(
            "w-[3px] shrink-0 rounded-full transition-colors",
            i < until ? "bg-brand" : "bg-ink-faint/45",
          )}
          style={{ height: `${Math.max(22, Math.min(1, pico) * 100)}%` }}
        />
      ))}
    </div>
  );
};
