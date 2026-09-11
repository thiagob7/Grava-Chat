import { useQuery } from "@tanstack/react-query";

import { findWhoReacted } from "~/@core/application/requests/message/quem-reagiu";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useWhoReacted = (messageId: string, active: boolean) =>
  useQuery({
    queryKey: queryKeys.channel.whoReacted(messageId),
    queryFn: () => findWhoReacted(messageId),
    enabled: active,
    staleTime: 15_000,
    retry: false,
  });
