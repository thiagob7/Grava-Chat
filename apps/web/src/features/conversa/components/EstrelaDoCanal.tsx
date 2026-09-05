import React from "react";
import { Star } from "@phosphor-icons/react";

import { Tooltip } from "~/components/ui/tooltip";
import { useFavoritos } from "~/features/servidor/stores/favoritos";
import { cn } from "~/lib/utils";

/// Vale para canal de servidor e para conversa: os dois são canal.
export const EstrelaDoCanal: React.FC<{ channelId: string }> = ({ channelId }) => {
  const favorito = useFavoritos((s) => s.canais.includes(channelId));
  const alternar = useFavoritos((s) => s.alternar);

  return (
    <Tooltip data-gc="conversa.estrela-do-canal.tooltip" label={favorito ? "Tirar dos favoritos" : "Favoritar"}>
      <button data-gc="conversa.estrela-do-canal.button"
        onClick={() => alternar(channelId)}
        aria-label={favorito ? "Tirar dos favoritos" : "Favoritar"}
        aria-pressed={favorito}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md transition hover:bg-hover",
          favorito ? "text-idle" : "text-ink-muted hover:text-ink",
        )}
      >
        <Star data-gc="conversa.estrela-do-canal.star" size={18} weight={favorito ? "fill" : "regular"} />
      </button>
    </Tooltip>
  );
};
