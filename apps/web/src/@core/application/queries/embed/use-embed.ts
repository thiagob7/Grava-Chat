import { useQuery } from "@tanstack/react-query";

import { findEmbed } from "~/@core/application/requests/embed/embeds";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export function useEmbed(url: string) {
  return useQuery({
    queryKey: queryKeys.embed.link(url),
    queryFn: () => findEmbed(url),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: false,
  });
}
