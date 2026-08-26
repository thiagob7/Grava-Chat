import { useInfiniteQuery } from "@tanstack/react-query";

import {
  buscarMensagens,
  type FiltrosDaBusca,
  type PaginaDaBusca,
} from "~/@core/application/requests/message/buscar-mensagens";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/**
 * A busca, página a página.
 *
 * O cursor é o id da última mensagem devolvida — o mesmo critério do
 * histórico, porque o id do Mongo cresce com o tempo. Sem `keepPreviousData`
 * de propósito: trocar de termo é uma busca nova, e mostrar o resultado
 * antigo embaixo do termo novo confunde mais do que espera.
 */
export function useBuscarMensagens(filtros: FiltrosDaBusca | null) {
  return useInfiniteQuery({
    queryKey: queryKeys.message.busca(
      filtros?.guildId ?? "",
      filtros?.termo ?? "",
      filtros?.canalId ?? "",
      filtros?.autorId ?? "",
    ),
    enabled: Boolean(filtros && filtros.termo.trim().length >= 2),
    queryFn: ({ pageParam }) => buscarMensagens(filtros!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (ultima: PaginaDaBusca) =>
      ultima.hasMore ? ultima.messages.at(-1)?.id : undefined,
    staleTime: 60_000,
  });
}
