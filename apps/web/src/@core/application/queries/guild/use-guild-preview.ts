import { useQuery } from "@tanstack/react-query";

import { findGuildPreview } from "~/@core/application/requests/guild/find-guild-preview";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useGuildPreview = (guildId: string | null) =>
  useQuery({
    queryKey: queryKeys.guild.preview(guildId ?? ""),
    queryFn: () => findGuildPreview(guildId!),
    enabled: Boolean(guildId),
    staleTime: 60_000,
  });
