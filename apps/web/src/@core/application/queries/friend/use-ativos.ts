import { useQuery } from "@tanstack/react-query";

import { findAtivos } from "~/@core/application/requests/friend/find-ativos";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useAtivos = () =>
  useQuery({
    queryKey: [queryKeys.friend.ativos],
    queryFn: findAtivos,
    refetchInterval: 10_000,
  });
