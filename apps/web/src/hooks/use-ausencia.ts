import { useEffect, useRef } from "react";

import { markMissing } from "~/@core/lib/websocket/emit-message-actions";

const IDLE_MS = 10 * 60_000;

const SIGNALS = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;

export function useAbsence(on: boolean) {
  const missing = useRef(false);

  useEffect(() => {
    if (!on) return;

    let timer: ReturnType<typeof setTimeout>;

    const notify = (idle: boolean) => {
      if (missing.current === idle) return;

      missing.current = idle;
      void markMissing(idle).catch(() => undefined);
    };

    const restart = () => {
      notify(false);
      clearTimeout(timer);
      timer = setTimeout(() => notify(true), IDLE_MS);
    };

    restart();
    for (const event of SIGNALS) window.addEventListener(event, restart, { passive: true });

    return () => {
      clearTimeout(timer);
      for (const event of SIGNALS) window.removeEventListener(event, restart);
      if (missing.current) void markMissing(false).catch(() => undefined);
    };
  }, [on]);
}
