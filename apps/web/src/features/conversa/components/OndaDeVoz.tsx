import React, { useEffect, useRef, useState } from "react";

import { BARRAS } from "~/features/conversa/lib/gravador-de-voz";
import { cn } from "~/lib/utils";

function neutral() {
  return Array.from({ length: BARRAS }, (_, i) => {
    const wave = Math.sin(i * 0.55) * 0.3 + Math.sin(i * 0.17) * 0.22;
    return 0.5 + wave;
  });
}

const BAR_STEP_PX = 5;

function useBarsThatFit(enabled: boolean) {
  const box = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(BARRAS);

  useEffect(() => {
    const element = box.current;
    if (!enabled || !element) return;

    const measure = () => setCount(Math.max(BARRAS, Math.floor((element.clientWidth + 2) / BAR_STEP_PX)));
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);

  return { box, count };
}

export const VoiceWave: React.FC<{
  peaks: number[];
  progress?: number;
  live?: boolean;
  className?: string;
}> = ({ peaks, progress = 0, live = false, className }) => {
  const { box, count } = useBarsThatFit(live);
  const barras = peaks.length ? peaks.slice(-(live ? count : BARRAS)) : neutral();
  const until = Math.round(progress * barras.length);

  return (
    <div data-gc="conversa.onda-de-voz.div" ref={box} className={cn("flex h-6 flex-1 items-center gap-[2px] overflow-hidden", className)}>
      {barras.map((pico, i) => (
        <span data-gc="conversa.onda-de-voz.span"
          key={i}
          className={cn(
            "w-[3px] shrink-0 rounded-full transition-colors",
            i < until ? "bg-brand" : "bg-ink-faint/45",
          )}
          style={{ height: `${Math.max(12, Math.min(1, pico) * 100)}%` }}
        />
      ))}
    </div>
  );
};
