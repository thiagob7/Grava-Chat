import { useCallback, useMemo, useState } from "react";

/**
 * Um formulário inteiro como um objeto só, com "mudou?" e "descartar" de graça.
 *
 * O editor de perfil tem mais de doze campos. Com um `useState` por campo,
 * "Descartar" vira doze linhas de `setX(original)` que alguém vai esquecer de
 * atualizar ao acrescentar o décimo terceiro — e o bug resultante ("descartei e
 * o banner continuou lá") é do tipo que ninguém reporta direito.
 *
 * O `original` é a fonte da verdade do que está salvo. Quando ele muda porque
 * o servidor respondeu, o rascunho intocado o acompanha.
 */
export function useRascunho<T extends object>(original: T) {
  const [alteracoes, setAlteracoes] = useState<Partial<T>>({});

  const rascunho = useMemo(() => ({ ...original, ...alteracoes }), [original, alteracoes]);

  /**
   * Voltar um campo ao valor salvo o TIRA das alterações em vez de gravá-lo
   * como igual. Sem isso, mexer numa cor e desfazer na mão deixaria a barra de
   * "não salvas" acesa para sempre, sem nada para salvar.
   */
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

  /** Vários campos de uma vez — trocar de tema mexe em duas cores juntas. */
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
    /** só o que mudou — é isso que vai no PATCH, e não o objeto inteiro */
    alteracoes,
    sujo: Object.keys(alteracoes).length > 0,
  };
}
