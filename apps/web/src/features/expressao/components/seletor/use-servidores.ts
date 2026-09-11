import { useMemo } from "react";
import type { GuildEmoji, Sticker } from "@gravae/shared";

import { useFindExpressionsOf } from "~/@core/application/queries/expression/use-expressions";
import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";

export interface ServerWithExpressions {
  id: string;
  name: string;
  iconUrl: string | null;
  emojis: GuildEmoji[];
  stickers: (Sticker & { createdBy: { displayName: string } | null })[];
}

export function useServers(currentGuildId: string | undefined): ServerWithExpressions[] {
  const { data: guilds = [] } = useFindManyGuilds(true);

  const ordered = useMemo(
    () => [
      ...guilds.filter((g) => g.id === currentGuildId),
      ...guilds.filter((g) => g.id !== currentGuildId),
    ],
    [guilds, currentGuildId],
  );

  const expressions = useFindExpressionsOf(ordered.map((g) => g.id));

  return ordered.map((guild, i) => ({
    id: guild.id,
    name: guild.name,
    iconUrl: guild.iconUrl,
    emojis: expressions[i]?.data.emojis ?? [],
    stickers: expressions[i]?.data.stickers ?? [],
  }));
}
