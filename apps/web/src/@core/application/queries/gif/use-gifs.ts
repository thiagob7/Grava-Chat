import { useQuery } from "@tanstack/react-query";

import {
  findGifConfig,
  findTrendingGifs,
  searchGifs,
} from "~/@core/application/requests/gif/gifs";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/** Sem chave de GIF no servidor, a aba explica o que falta em vez de quebrar. */
export const useGifConfig = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.gif.config],
    queryFn: findGifConfig,
    enabled,
    staleTime: Infinity,
  });

export const useTrendingGifs = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.gif.trending],
    queryFn: findTrendingGifs,
    enabled,
    staleTime: 10 * 60_000,
  });

/**
 * A busca só dispara com o termo já "parado" (o componente faz o debounce) e o
 * resultado fica em cache — a cota é do dono da chave, não infinita.
 */
export const useSearchGifs = (termo: string) =>
  useQuery({
    queryKey: queryKeys.gif.search(termo),
    queryFn: () => searchGifs(termo),
    enabled: termo.trim().length > 1,
    staleTime: 10 * 60_000,
  });
