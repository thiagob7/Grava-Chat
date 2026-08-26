import { useMutation } from "@tanstack/react-query";

import { findVoiceToken } from "~/@core/application/requests/voice/find-voice-token";

export const useVoiceToken = () =>
  useMutation({
    mutationFn: (channelId: string) => findVoiceToken(channelId),
  });
