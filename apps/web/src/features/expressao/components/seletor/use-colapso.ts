import { useCallback, useState } from "react";

export function useCollapse(tab: string) {
  const key = `gravae:secoes-fechadas:${tab}`;

  const [closed, setClosed] = useState<Set<string>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
      return new Set(Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : []);
    } catch {
      return new Set();
    }
  });

  const toggle = useCallback(
    (id: string) => {
      setClosed((current) => {
        const next = new Set(current);
        if (!next.delete(id)) next.add(id);

        try {
          localStorage.setItem(key, JSON.stringify([...next]));
        } catch {
        }

        return next;
      });
    },
    [key],
  );

  const open = useCallback(
    (id: string) => {
      setClosed((current) => {
        if (!current.has(id)) return current;

        const next = new Set(current);
        next.delete(id);

        try {
          localStorage.setItem(key, JSON.stringify([...next]));
        } catch {
        }

        return next;
      });
    },
    [key],
  );

  return { closed, toggle, open };
}
