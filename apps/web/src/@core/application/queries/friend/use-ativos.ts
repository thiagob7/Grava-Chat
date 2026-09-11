import { useQuery } from "@tanstack/react-query";

import { findActive } from "~/@core/application/requests/friend/find-ativos";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useActive = () =>
  useQuery({
    queryKey: [queryKeys.friend.actives],
    queryFn: findActive,
    refetchInterval: 10_000,
  });
