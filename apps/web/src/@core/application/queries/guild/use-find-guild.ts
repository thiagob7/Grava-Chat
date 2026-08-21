import { useQuery } from "@tanstack/react-query";

import { findGuild } from "~/@core/application/requests/guild/find-guild";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindGuild = (guildId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.guild.find(guildId ?? ""),
    queryFn: () => findGuild(guildId!),
    enabled: Boolean(guildId),
    /**
     * Este snapshot carrega presença e estado de voz vindos do Redis. Os
     * eventos de socket atualizam o cache dali pra frente; o refetch acontece
     * na reconexão (ver use-realtime), não por tempo.
     */
    staleTime: Infinity,
  });
