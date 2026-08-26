import { useCallback, useMemo, useState } from "react";

export function useRascunho<T extends object>(original: T) {
  const [alteracoes, setAlteracoes] = useState<Partial<T>>({});

  const rascunho = useMemo(() => ({ ...original, ...alteracoes }), [original, alteracoes]);

  const definir = useCallback(
    <K extends keyof T>(campo: K, valor: T[K]) => {
      setAlteracoes((atual) => {
        const proximo = { ...atual, [campo]: valor };
        if (Object.is(valor, original[campo])) delete proximo[campo];

        return proximo;
      });
    },
    [original],
  );

  const definirVarios = useCallback(
    (valores: Partial<T>) => {
      setAlteracoes((atual) => {
        const proximo = { ...atual, ...valores };
        for (const chave of Object.keys(valores) as (keyof T)[]) {
          if (Object.is(proximo[chave], original[chave])) delete proximo[chave];
        }

        return proximo;
      });
    },
    [original],
  );

  const descartar = useCallback(() => setAlteracoes({}), []);

  return {
    rascunho,
    definir,
    definirVarios,
    descartar,
    alteracoes,
    sujo: Object.keys(alteracoes).length > 0,
  };
}
