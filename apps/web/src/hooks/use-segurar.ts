import { useCallback, useRef } from "react";

const SEGURAR_MS = 450;

/**
 * Clique curto faz uma coisa, clique segurado faz outra — é como se dispara a
 * super reação sem precisar de um botão só pra isso.
 *
 * O `onClick` normal não serve de par: ele dispara mesmo depois de um clique
 * longo, e o gesto contaria duas vezes. Por isso tudo sai do ponteiro, e o
 * `pointerup` decide qual dos dois aconteceu.
 */
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
