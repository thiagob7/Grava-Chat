import { useCallback, useMemo, useState } from "react";

export function useDraft<T extends object>(original: T) {
  const [changes, setChanges] = useState<Partial<T>>({});

  const draft = useMemo(() => ({ ...original, ...changes }), [original, changes]);

  const set = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setChanges((current) => {
        const next = { ...current, [field]: value };
        if (Object.is(value, original[field])) delete next[field];

        return next;
      });
    },
    [original],
  );

  const setSeveral = useCallback(
    (values: Partial<T>) => {
      setChanges((current) => {
        const next = { ...current, ...values };
        for (const key of Object.keys(values) as (keyof T)[]) {
          if (Object.is(next[key], original[key])) delete next[key];
        }

        return next;
      });
    },
    [original],
  );

  const discard = useCallback(() => setChanges({}), []);

  return {
    draft,
    set,
    setSeveral,
    discard,
    changes,
    dirty: Object.keys(changes).length > 0,
  };
}
