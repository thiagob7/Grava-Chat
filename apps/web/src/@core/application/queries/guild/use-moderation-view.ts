import { useQuery } from "@tanstack/react-query";

import { findModerationView } from "~/@core/application/requests/guild/find-moderation-view";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useModerationView = (guildId: string | null, userId: string | null) =>
  useQuery({
    queryKey: [queryKeys.guild.moderation, guildId, userId],
    queryFn: () => findModerationView(guildId!, userId!),
    enabled: Boolean(guildId && userId),
  });
