import { useQuery } from "@tanstack/react-query";

import { findProfile } from "~/@core/application/requests/user/find-profile";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/** `enabled` só quando o cartão abre: não busca perfil de gente que ninguém clicou. */
export const useFindProfile = (userId: string | null) =>
  useQuery({
    queryKey: queryKeys.user.profile(userId ?? ""),
    queryFn: () => findProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
