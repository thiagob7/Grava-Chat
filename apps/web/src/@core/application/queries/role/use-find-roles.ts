import { useQuery } from "@tanstack/react-query";

import { findRoles } from "~/@core/application/requests/role/find-roles";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindRoles = (guildId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: queryKeys.role.find_many(guildId ?? ""),
    queryFn: () => findRoles(guildId!),
    enabled: Boolean(guildId) && enabled,
  });
