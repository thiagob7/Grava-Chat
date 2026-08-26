import { useEffect, useRef } from "react";

import { useVoiceStore, voiceTabChannelId } from "~/stores/voice-store";

export function useReconnectVoice(enabled: boolean) {
  const join = useVoiceStore((s) => s.join);
  const connectedHere = useVoiceStore((s) => s.channelId);
  const tentou = useRef(false);

  useEffect(() => {
    if (!enabled || tentou.current) return;

    if (connectedHere) {
      tentou.current = true;
      return;
    }

    const channelId = voiceTabChannelId();
    if (!channelId) return;

    tentou.current = true;

    void join(channelId, { resume: true }).catch(() => undefined);
  }, [enabled, connectedHere, join]);
}
