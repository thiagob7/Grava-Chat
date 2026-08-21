import { useQuery } from "@tanstack/react-query";

import { findGuildInvites } from "~/@core/application/requests/guild/find-guild-invites";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindGuildInvites = (guildId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.guild.invites(guildId ?? ""),
    queryFn: () => findGuildInvites(guildId!),
    enabled: Boolean(guildId) && enabled,
  });
