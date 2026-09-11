import React from "react";

import { cn } from "~/lib/utils";

const RINGS = [0, 420, 840];

export const SpeechWaves: React.FC<{ size: number; className?: string }> = ({
  size,
  className,
}) => (
  <span data-gc="voz.ondas-de-fala.span"
    aria-hidden
    className={cn(
      "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 motion-reduce:hidden",
      className,
    )}
    style={{ width: size, height: size }}
  >
    {RINGS.map((delay) => (
      <span data-gc="voz.ondas-de-fala.span--2"
        key={delay}
        className="absolute inset-0 animate-ping rounded-full border-2 border-online opacity-0"
        style={{ animationDelay: `${delay}ms`, animationDuration: "1400ms" }}
      />
    ))}
  </span>
);
