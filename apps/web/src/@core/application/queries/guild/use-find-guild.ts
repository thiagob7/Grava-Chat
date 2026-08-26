import { useQuery } from "@tanstack/react-query";

import { findGuild } from "~/@core/application/requests/guild/find-guild";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindGuild = (guildId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.guild.find(guildId ?? ""),
    queryFn: () => findGuild(guildId!),
    enabled: Boolean(guildId),
    staleTime: Infinity,
  });
