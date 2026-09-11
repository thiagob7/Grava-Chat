import { useQuery } from "@tanstack/react-query";

import { findDmRequests } from "~/@core/application/requests/friend/find-pedidos-de-dm";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useDmRequests = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.friend.requests],
    queryFn: findDmRequests,
    enabled,
  });
