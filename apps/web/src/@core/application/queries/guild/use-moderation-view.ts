import { useQuery } from "@tanstack/react-query";

import { findModerationView } from "~/@core/application/requests/guild/find-moderation-view";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/**
 * Só busca quando a visualização está aberta: é consulta cara (três contagens
 * no banco) e ninguém precisa dela pra ver um cartão de perfil.
 */
export const useModerationView = (guildId: string | null, userId: string | null) =>
  useQuery({
    queryKey: [queryKeys.guild.moderation, guildId, userId],
    queryFn: () => findModerationView(guildId!, userId!),
    enabled: Boolean(guildId && userId),
  });
