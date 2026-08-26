import { useQuery } from "@tanstack/react-query";

import { findModerationMessages } from "~/@core/application/requests/guild/find-moderation-messages";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useModerationMessages = (
  guildId: string | null,
  userId: string | null,
  filtro: "todas" | "links" | "midia" | null,
) =>
  useQuery({
    queryKey: [queryKeys.guild.moderation_messages, guildId, userId, filtro],
    queryFn: () => findModerationMessages(guildId!, userId!, filtro!),
    enabled: Boolean(guildId && userId && filtro),
  });
