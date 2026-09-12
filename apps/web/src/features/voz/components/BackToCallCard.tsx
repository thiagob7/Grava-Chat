import React from "react";
import { PhoneCall } from "@phosphor-icons/react";

import { cn } from "~/lib/utils";

export const BackToCallCard: React.FC<{ name: string; onBack: () => void }> = ({
  name,
  onBack,
}) => (
  <button data-gc="voz.back-to-call-card.button.on-back"
    type="button"
    onClick={onBack}
    aria-label="Voltar para a chamada"
    className={cn(
      "relative aspect-video w-[clamp(7rem,12vw,10rem)] shrink-0 overflow-hidden rounded-lg bg-surface-3 transition",
      "hover:bg-surface-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand",
    )}
  >
    <span data-gc="voz.back-to-call-card.span" className="flex size-full items-center justify-center">
      <span data-gc="voz.back-to-call-card.span--2" className="flex size-9 items-center justify-center rounded-full bg-surface-4/80 text-ink shadow-lg backdrop-blur">
        <PhoneCall data-gc="voz.back-to-call-card.phone-call" size={18} weight="fill" />
      </span>
    </span>

    <span data-gc="voz.back-to-call-card.span--3" className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-0.75rem)] truncate rounded bg-surface-1/80 px-1.5 py-0.5 text-11 text-ink">
      {name}
    </span>
  </button>
);
