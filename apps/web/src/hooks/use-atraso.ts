import { useEffect, useState } from "react";

export function useDelay<T>(value: T, ms = 300): T {
  const [late, setLate] = useState(value);

  useEffect(() => {
    const deadline = window.setTimeout(() => setLate(value), ms);
    return () => window.clearTimeout(deadline);
  }, [value, ms]);

  return late;
}
