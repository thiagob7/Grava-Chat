import { useCallback, useRef } from "react";

const HOLD_MS = 450;

export function useHold(short: () => void, long: () => void) {
  const fired = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  return {
    onPointerDown: useCallback(
      (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        fired.current = false;

        timer.current = setTimeout(() => {
          fired.current = true;
          long();
        }, HOLD_MS);
      },
      [long],
    ),

    onPointerUp: useCallback(
      (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        clear();
        if (!fired.current) short();
      },
      [short, clear],
    ),

    onPointerLeave: useCallback(() => clear(), [clear]),
    onPointerCancel: useCallback(() => clear(), [clear]),
  };
}
