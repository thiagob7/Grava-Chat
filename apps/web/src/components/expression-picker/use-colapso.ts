import { useCallback, useState } from "react";

/**
 * Quais seções estão fechadas, lembradas entre uma abertura e outra.
 *
 * O seletor vive dentro de um popover: fechar e reabrir desmonta tudo. Sem
 * guardar no navegador, fechar "Bandeiras" duraria até o próximo emoji — e
 * quem fecha uma seção quer que ela fique fechada.
 *
 * A chave separa emoji de figurinhas: as duas abas têm seções com o mesmo id
 * (`servidor:123`), e fechar o servidor numa fecharia na outra.
 */
export function useColapso(aba: string) {
  const chave = `gravae:secoes-fechadas:${aba}`;

  const [fechadas, setFechadas] = useState<Set<string>>(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(chave) ?? "[]") as unknown;
      return new Set(Array.isArray(salvo) ? salvo.filter((id) => typeof id === "string") : []);
    } catch {
      return new Set();
    }
  });

  const alternar = useCallback(
    (id: string) => {
      setFechadas((atuais) => {
        const proximas = new Set(atuais);
        if (!proximas.delete(id)) proximas.add(id);

        try {
          localStorage.setItem(chave, JSON.stringify([...proximas]));
        } catch {
          /* modo privado: vale só nesta aba */
        }

        return proximas;
      });
    },
    [chave],
  );

  const abrir = useCallback(
    (id: string) => {
      setFechadas((atuais) => {
        if (!atuais.has(id)) return atuais;

        const proximas = new Set(atuais);
        proximas.delete(id);

        try {
          localStorage.setItem(chave, JSON.stringify([...proximas]));
        } catch {
          /* modo privado: vale só nesta aba */
        }

        return proximas;
      });
    },
    [chave],
  );

  return { fechadas, alternar, abrir };
}
