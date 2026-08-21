import { useEffect, useRef } from "react";

import { useVoiceStore, voiceTabChannelId } from "~/stores/voice-store";

/**
 * Devolve você para a chamada depois de um reload.
 *
 * Só a aba que estava na chamada tenta voltar (marca em sessionStorage, que
 * sobrevive ao reload mas é isolado por aba). Se outra aba tiver assumido a
 * chamada nesse meio-tempo, o servidor recusa a retomada — quem decide isso é
 * ele, no momento do pedido.
 */
export function useReconnectVoice(enabled: boolean) {
  const join = useVoiceStore((s) => s.join);
  const connectedHere = useVoiceStore((s) => s.channelId);
  const tentou = useRef(false);

  useEffect(() => {
    if (!enabled || tentou.current || connectedHere) return;

    const channelId = voiceTabChannelId();
    if (!channelId) return;

    tentou.current = true;

    /**
     * Pede a retomada e deixa o SERVIDOR decidir. Se outra aba estiver ao vivo
     * na chamada, ele recusa e a tela de "em chamada em outra aba" assume — sem
     * depender de o estado de "órfã" ter chegado antes por evento, que é uma
     * corrida perdida na metade das vezes.
     */
    void join(channelId, { resume: true }).catch(() => undefined);
  }, [enabled, connectedHere, join]);
}
