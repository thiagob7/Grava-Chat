import { useQuery } from "@tanstack/react-query";

import { findMentions } from "~/@core/application/requests/message/find-mentions";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindMentions = (active: boolean) =>
  useQuery({
    queryKey: [queryKeys.message.mentions],
    queryFn: findMentions,
    enabled: active,
    staleTime: 30_000,
  });
