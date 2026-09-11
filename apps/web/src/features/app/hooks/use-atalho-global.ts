import { useEffect, useRef } from "react";

import { SHORTCUTS, eventMatches } from "~/features/configuracoes/lib/atalhos";
import { useShortcuts } from "~/features/configuracoes/stores/atalhos";

export function useShortcutGlobal(id: string, action: () => void) {
  const swapped = useShortcuts((s) => s.swapped);
  const off = useShortcuts((s) => s.off);

  const lastAction = useRef(action);
  lastAction.current = action;

  useEffect(() => {
    const shortcut = SHORTCUTS.find((a) => a.id === id);
    if (!shortcut || off.includes(id)) return;

    const combo = swapped[id] ?? shortcut.fallback;

    const onType = (event: KeyboardEvent) => {
      if (!eventMatches(event, combo)) return;

      event.preventDefault();
      lastAction.current();
    };

    window.addEventListener("keydown", onType);
    return () => window.removeEventListener("keydown", onType);
  }, [id, swapped, off]);
}
