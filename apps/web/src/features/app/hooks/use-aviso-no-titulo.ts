import { useEffect } from "react";

import { useReadStates } from "~/@core/application/queries/message/use-read-states";
import { useNotices } from "~/stores/notificacoes";

const BASE = "Gravaê";

export function useNoticeTitle(active: boolean) {
  const { data: readStates } = useReadStates(active);
  const counter = useNotices((s) => s.counter);

  useEffect(() => {
    if (!active || !counter) {
      document.title = BASE;
      void window.gravae?.appWindow?.counter(0);
      return;
    }

    const states = Object.values(readStates ?? {});
    const mentions = states.reduce((total, e) => total + e.mentions, 0);
    const notRead = states.reduce((total, e) => total + e.notRead, 0);

    document.title = mentions ? `(${mentions}) ${BASE}` : notRead ? `• ${BASE}` : BASE;
    void window.gravae?.appWindow?.counter(mentions);
  }, [active, counter, readStates]);

  useEffect(
    () => () => {
      document.title = BASE;
      void window.gravae?.appWindow?.counter(0);
    },
    [],
  );
}
