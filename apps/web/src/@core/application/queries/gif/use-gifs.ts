import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  findFavoriteGifs,
  findGifCategories,
  findGifConfig,
  findTrendingGifs,
  removeFavoriteGif,
  saveFavoriteGif,
  searchGifs,
  type GifModel,
} from "~/@core/application/requests/gif/gifs";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

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

export const useSearchGifs = (term: string) =>
  useQuery({
    queryKey: queryKeys.gif.search(term),
    queryFn: () => searchGifs(term),
    enabled: term.trim().length > 1,
    staleTime: 10 * 60_000,
  });

export const useGifCategories = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.gif.categories],
    queryFn: findGifCategories,
    enabled,
    staleTime: 60 * 60_000,
  });

export const useFavoriteGifs = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.gif.favorites],
    queryFn: findFavoriteGifs,
    enabled,
    staleTime: 5 * 60_000,
  });

export const useToggleFavoriteGif = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gif, saved }: { gif: GifModel; saved: boolean }) =>
      saved ? removeFavoriteGif(gif.id) : saveFavoriteGif(gif),
    onSuccess: (list) => queryClient.setQueryData([queryKeys.gif.favorites], list),
    onError: (e) => toast.error(apiErrorMessage(e, "Não deu pra salvar esse GIF.")),
  });
};
