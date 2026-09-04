import { useQuery } from "@tanstack/react-query";

import { findEmComum } from "~/@core/application/requests/user/find-em-comum";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindEmComum = (userId: string | null, ativo: boolean) =>
  useQuery({
    queryKey: queryKeys.user.emComum(userId ?? ""),
    queryFn: () => findEmComum(userId!),
    enabled: Boolean(userId) && ativo,
    staleTime: 60_000,
  });
