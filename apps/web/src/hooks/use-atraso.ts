import { useEffect, useState } from "react";

export function useAtraso<T>(valor: T, ms = 300): T {
  const [atrasado, setAtrasado] = useState(valor);

  useEffect(() => {
    const prazo = window.setTimeout(() => setAtrasado(valor), ms);
    return () => window.clearTimeout(prazo);
  }, [valor, ms]);

  return atrasado;
}
