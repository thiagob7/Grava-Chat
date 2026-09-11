import { useCallback, useEffect, useState } from "react";

import { useAppearance } from "~/features/configuracoes/stores/aparencia";

const KEY = "gravae:categorias-fechadas";

export function useCategoriesClosed(): [
  Record<string, boolean>,
  (next: Record<string, boolean>) => void,
] {
  const remember = useAppearance((s) => s.rememberCategoriesClosed);
  const [closed, setClosed] = useState<Record<string, boolean>>(() =>
    remember ? read() : {},
  );

  useEffect(() => {
    if (remember) {
      setClosed(read());
      return;
    }

    try {
      localStorage.removeItem(KEY);
    } catch {
    }
  }, [remember]);

  const keep = useCallback(
    (next: Record<string, boolean>) => {
      setClosed(next);
      if (!remember) return;

      try {
        const closedSo = Object.fromEntries(
          Object.entries(next).filter(([, value]) => value),
        );

        localStorage.setItem(KEY, JSON.stringify(closedSo));
      } catch {
      }
    },
    [remember],
  );

  return [closed, keep];
}

function read(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};

    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return {};

    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([id, value]) => [
        id,
        Boolean(value),
      ]),
    );
  } catch {
    return {};
  }
}
