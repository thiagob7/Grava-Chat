import { useCallback, useRef } from "react";

const SEGURAR_MS = 450;

export function useSegurar(curto: () => void, longo: () => void) {
  const disparou = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const limpar = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  return {
    onPointerDown: useCallback(
      (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        disparou.current = false;

        timer.current = setTimeout(() => {
          disparou.current = true;
          longo();
        }, SEGURAR_MS);
      },
      [longo],
    ),

    onPointerUp: useCallback(
      (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        limpar();
        if (!disparou.current) curto();
      },
      [curto, limpar],
    ),

    onPointerLeave: useCallback(() => limpar(), [limpar]),
    onPointerCancel: useCallback(() => limpar(), [limpar]),
  };
}
