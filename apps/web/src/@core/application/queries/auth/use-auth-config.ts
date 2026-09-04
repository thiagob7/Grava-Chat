import { useQuery } from "@tanstack/react-query";

import { findAuthConfig } from "~/@core/application/requests/auth/find-auth-config";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useAuthConfig = () =>
  useQuery({
    queryKey: [queryKeys.auth.config],
    queryFn: findAuthConfig,

    retry: 6,
    retryDelay: (tentativa) => Math.min(1000 * 2 ** tentativa, 8000),

    refetchInterval: (query) => (query.state.status === "error" ? 5000 : false),
    refetchIntervalInBackground: false,
  });
