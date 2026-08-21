import { useQuery } from "@tanstack/react-query";

import { findMe } from "~/@core/application/requests/auth/find-me";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useMe = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.auth.me],
    queryFn: findMe,
    enabled,
    // O usuário logado muda pouco; presença chega por socket, não por refetch.
    staleTime: 5 * 60_000,
  });
