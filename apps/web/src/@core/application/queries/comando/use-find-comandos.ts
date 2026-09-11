import { useQuery } from "@tanstack/react-query";

import { findCommands } from "~/@core/application/requests/comando/find-comandos";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindCommands = (guildId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.command.find_many(guildId ?? ""),
    queryFn: () => findCommands(guildId!),
    enabled: Boolean(guildId),
    staleTime: Infinity,
  });
