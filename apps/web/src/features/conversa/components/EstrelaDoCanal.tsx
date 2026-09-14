import React from "react";
import { Star } from "@phosphor-icons/react";

import { IconButton } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { useFavorites } from "~/features/servidor/stores/favoritos";
import { cn } from "~/lib/utils";

export const ChannelStar: React.FC<{ channelId: string }> = ({ channelId }) => {
  const favorite = useFavorites((s) => s.channels.includes(channelId));
  const toggle = useFavorites((s) => s.toggle);

  return (
    <Tooltip data-gc="conversa.estrela-do-canal.tooltip" label={favorite ? "Tirar dos favoritos" : "Favoritar"}>
      <IconButton data-gc="conversa.estrela-do-canal.icon-button"
        onClick={() => toggle(channelId)}
        label={favorite ? "Tirar dos favoritos" : "Favoritar"}
        aria-pressed={favorite}
        className={cn(
          "gc-icone gc-icone--brilha [&_svg]:size-5",
          favorite && "text-idle hover:text-idle",
        )}
      >
        <Star data-gc="conversa.estrela-do-canal.star" weight={favorite ? "fill" : "regular"} />
      </IconButton>
    </Tooltip>
  );
};
