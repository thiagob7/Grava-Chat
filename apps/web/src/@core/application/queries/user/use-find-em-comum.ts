import { useQuery } from "@tanstack/react-query";

import { findCommon } from "~/@core/application/requests/user/find-em-comum";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindCommon = (userId: string | null, active: boolean) =>
  useQuery({
    queryKey: queryKeys.user.inCommon(userId ?? ""),
    queryFn: () => findCommon(userId!),
    enabled: Boolean(userId) && active,
    staleTime: 60_000,
  });
