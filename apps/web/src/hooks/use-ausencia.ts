import { useEffect, useRef } from "react";

import { marcarAusente } from "~/@core/lib/websocket/emit-message-actions";

const OCIOSO_MS = 10 * 60_000;

const SINAIS = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;

export function useAusencia(ligado: boolean) {
  const ausente = useRef(false);

  useEffect(() => {
    if (!ligado) return;

    let timer: ReturnType<typeof setTimeout>;

    const avisar = (idle: boolean) => {
      if (ausente.current === idle) return;

      ausente.current = idle;
      void marcarAusente(idle).catch(() => undefined);
    };

    const reiniciar = () => {
      avisar(false);
      clearTimeout(timer);
      timer = setTimeout(() => avisar(true), OCIOSO_MS);
    };

    reiniciar();
    for (const evento of SINAIS) window.addEventListener(evento, reiniciar, { passive: true });

    return () => {
      clearTimeout(timer);
      for (const evento of SINAIS) window.removeEventListener(evento, reiniciar);
      if (ausente.current) void marcarAusente(false).catch(() => undefined);
    };
  }, [ligado]);
}
