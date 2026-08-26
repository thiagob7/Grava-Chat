import { useQuery } from "@tanstack/react-query";

import { findMe } from "~/@core/application/requests/auth/find-me";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useMe = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.auth.me],
    queryFn: findMe,
    enabled,
    staleTime: 5 * 60_000,
  });
