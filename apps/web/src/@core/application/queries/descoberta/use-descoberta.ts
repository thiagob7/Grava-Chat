import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  joinCommunity,
  findApps,
  findCommunities,
  findGalleryThemes,
  type DiscoveryFilter,
} from "~/@core/application/requests/descoberta/descoberta";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useCommunities = (filter: DiscoveryFilter) =>
  useQuery({
    queryKey: queryKeys.discovery.communities(filter.category ?? "", filter.search ?? ""),
    queryFn: () => findCommunities(filter),
    placeholderData: keepPreviousData,
  });

export const useGalleryThemes = (search: string) =>
  useQuery({
    queryKey: queryKeys.discovery.themes(search),
    queryFn: () => findGalleryThemes(search || undefined),
    placeholderData: keepPreviousData,
  });

export const useApps = (search: string, category = "") =>
  useQuery({
    queryKey: queryKeys.discovery.apps(`${category}|${search}`),
    queryFn: () => findApps(search || undefined, category || undefined),
    placeholderData: keepPreviousData,
  });

export const useJoinCommunity = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: joinCommunity,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
      void client.invalidateQueries({ queryKey: ["descobrir-comunidades"] });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });
};
