import { useInfiniteQuery } from "@tanstack/react-query";

import {
  searchMessages,
  type SearchFilters,
  type SearchPage,
} from "~/@core/application/requests/message/buscar-mensagens";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export function useSearchMessages(filters: SearchFilters | null, ready: boolean) {
  return useInfiniteQuery({
    queryKey: queryKeys.message.search(JSON.stringify(filters ?? {})),
    enabled: Boolean(filters) && ready,
    queryFn: ({ pageParam }) => searchMessages(filters!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: SearchPage) =>
      last.hasMore ? last.messages.at(-1)?.id : undefined,
    staleTime: 60_000,
  });
}
