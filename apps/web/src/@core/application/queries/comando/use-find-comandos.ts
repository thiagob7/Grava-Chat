import { useQuery } from "@tanstack/react-query";

import { findComandos } from "~/@core/application/requests/comando/find-comandos";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindComandos = (guildId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.comando.find_many(guildId ?? ""),
    queryFn: () => findComandos(guildId!),
    enabled: Boolean(guildId),
    staleTime: Infinity,
  });
