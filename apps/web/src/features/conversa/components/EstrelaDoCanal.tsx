import React from "react";
import { Star } from "@phosphor-icons/react";

import { Tooltip } from "~/components/ui/tooltip";
import { useFavorites } from "~/features/servidor/stores/favoritos";
import { cn } from "~/lib/utils";

export const ChannelStar: React.FC<{ channelId: string }> = ({ channelId }) => {
  const favorite = useFavorites((s) => s.channels.includes(channelId));
  const toggle = useFavorites((s) => s.toggle);

  return (
    <Tooltip data-gc="conversa.estrela-do-canal.tooltip" label={favorite ? "Tirar dos favoritos" : "Favoritar"}>
      <button data-gc="conversa.estrela-do-canal.button"
        onClick={() => toggle(channelId)}
        aria-label={favorite ? "Tirar dos favoritos" : "Favoritar"}
        aria-pressed={favorite}
        className={cn(
          "gc-icone gc-icone--brilha flex size-8 shrink-0 items-center justify-center rounded-md transition hover:bg-hover",
          favorite ? "text-idle" : "text-ink-muted hover:text-ink",
        )}
      >
        <Star data-gc="conversa.estrela-do-canal.star" size={20} weight={favorite ? "fill" : "regular"} />
      </button>
    </Tooltip>
  );
};
