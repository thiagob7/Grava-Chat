import { useQuery } from "@tanstack/react-query";

import { findAuthConfig } from "~/@core/application/requests/auth/find-auth-config";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useAuthConfig = () =>
  useQuery({
    queryKey: [queryKeys.auth.config],
    queryFn: findAuthConfig,
    retry: 1,
  });
