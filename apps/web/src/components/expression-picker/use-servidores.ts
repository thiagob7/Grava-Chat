import { useMemo } from "react";
import type { GuildEmoji, Sticker } from "@gravae/shared";

import { useFindExpressionsOf } from "~/@core/application/queries/expression/use-expressions";
import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";

export interface ServidorComExpressoes {
  id: string;
  nome: string;
  iconUrl: string | null;
  emojis: GuildEmoji[];
  figurinhas: (Sticker & { createdBy: { displayName: string } | null })[];
}

export function useServidores(guildIdAtual: string | undefined): ServidorComExpressoes[] {
  const { data: guilds = [] } = useFindManyGuilds(true);

  const ordenados = useMemo(
    () => [
      ...guilds.filter((g) => g.id === guildIdAtual),
      ...guilds.filter((g) => g.id !== guildIdAtual),
    ],
    [guilds, guildIdAtual],
  );

  const expressoes = useFindExpressionsOf(ordenados.map((g) => g.id));

  return ordenados.map((guild, i) => ({
    id: guild.id,
    nome: guild.name,
    iconUrl: guild.iconUrl,
    emojis: expressoes[i]?.data.emojis ?? [],
    figurinhas: expressoes[i]?.data.stickers ?? [],
  }));
}
