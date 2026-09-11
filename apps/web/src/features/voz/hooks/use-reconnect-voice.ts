import { useEffect, useRef } from "react";

import { useVoiceStore, voiceTabChannelId } from "~/features/voz/stores/voice-store";

export function useReconnectVoice(enabled: boolean) {
  const join = useVoiceStore((s) => s.join);
  const connectedHere = useVoiceStore((s) => s.channelId);
  const tried = useRef(false);

  useEffect(() => {
    if (!enabled || tried.current) return;

    if (connectedHere) {
      tried.current = true;
      return;
    }

    const channelId = voiceTabChannelId();
    if (!channelId) return;

    tried.current = true;

    void join(channelId, { resume: true }).catch(() => undefined);
  }, [enabled, connectedHere, join]);
}
