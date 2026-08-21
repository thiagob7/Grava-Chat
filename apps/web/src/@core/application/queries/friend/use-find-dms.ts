import { useQuery } from "@tanstack/react-query";

import { findDms } from "~/@core/application/requests/friend/find-dms";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindDms = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.friend.dms],
    queryFn: findDms,
    enabled,
  });
