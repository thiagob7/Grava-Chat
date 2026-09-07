import { useInfiniteQuery } from "@tanstack/react-query";

import {
  buscarMensagens,
  type FiltrosDaBusca,
  type PaginaDaBusca,
} from "~/@core/application/requests/message/buscar-mensagens";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export function useBuscarMensagens(filtros: FiltrosDaBusca | null, pronta: boolean) {
  return useInfiniteQuery({
    queryKey: queryKeys.message.busca(JSON.stringify(filtros ?? {})),
    enabled: Boolean(filtros) && pronta,
    queryFn: ({ pageParam }) => buscarMensagens(filtros!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (ultima: PaginaDaBusca) =>
      ultima.hasMore ? ultima.messages.at(-1)?.id : undefined,
    staleTime: 60_000,
  });
}
