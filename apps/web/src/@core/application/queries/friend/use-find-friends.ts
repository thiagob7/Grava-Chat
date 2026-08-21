import { useQuery } from "@tanstack/react-query";

import { findFriends } from "~/@core/application/requests/friend/find-friends";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindFriends = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.friend.find_many],
    queryFn: findFriends,
    enabled,
  });
