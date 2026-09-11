import { useQuery } from "@tanstack/react-query";

import { findModerationMessages } from "~/@core/application/requests/guild/find-moderation-messages";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useModerationMessages = (
  guildId: string | null,
  userId: string | null,
  filter: "todas" | "links" | "midia" | null,
) =>
  useQuery({
    queryKey: [queryKeys.guild.moderation_messages, guildId, userId, filter],
    queryFn: () => findModerationMessages(guildId!, userId!, filter!),
    enabled: Boolean(guildId && userId && filter),
  });
