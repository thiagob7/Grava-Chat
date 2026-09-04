import { useQuery } from "@tanstack/react-query";

import { findVoiceStates } from "~/@core/application/requests/voice/find-voice-states";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useVoiceStates = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.voice.states],
    queryFn: findVoiceStates,
    enabled,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
