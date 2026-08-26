import { useQuery } from "@tanstack/react-query";

import { findProfile } from "~/@core/application/requests/user/find-profile";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindProfile = (userId: string | null) =>
  useQuery({
    queryKey: queryKeys.user.profile(userId ?? ""),
    queryFn: () => findProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
