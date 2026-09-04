import { useQuery } from "@tanstack/react-query";

import { findStatus } from "~/@core/application/requests/status/find-status";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useStatus = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.status.find],
    queryFn: findStatus,
    enabled,
    refetchInterval: 5_000,
  });
