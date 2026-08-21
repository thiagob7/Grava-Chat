import { useQuery } from "@tanstack/react-query";

import { findReadStates } from "~/@core/application/requests/message/find-read-states";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useReadStates = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.message.read_states],
    queryFn: findReadStates,
    enabled,
    select: (states) =>
      Object.fromEntries(states.map((s) => [s.channelId, s.lastReadMessageId])) as Record<
        string,
        string | null
      >,
  });
