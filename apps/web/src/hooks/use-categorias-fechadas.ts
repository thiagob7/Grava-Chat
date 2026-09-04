import { useCallback, useEffect, useState } from "react";

import { useAparencia } from "~/stores/aparencia";

const CHAVE = "gravae:categorias-fechadas";

export function useCategoriasFechadas(): [
  Record<string, boolean>,
  (proximo: Record<string, boolean>) => void,
] {
  const lembrar = useAparencia((s) => s.lembrarCategoriasFechadas);
  const [fechadas, setFechadas] = useState<Record<string, boolean>>(() =>
    lembrar ? ler() : {},
  );

  useEffect(() => {
    if (lembrar) {
      setFechadas(ler());
      return;
    }

    try {
      localStorage.removeItem(CHAVE);
    } catch {
      /// Navegador com armazenamento bloqueado. Não lembrar já era o pedido.
    }
  }, [lembrar]);

  const guardar = useCallback(
    (proximo: Record<string, boolean>) => {
      setFechadas(proximo);
      if (!lembrar) return;

      try {
        const fechadasSo = Object.fromEntries(
          Object.entries(proximo).filter(([, valor]) => valor),
        );

        localStorage.setItem(CHAVE, JSON.stringify(fechadasSo));
      } catch {
        /// Idem: sem armazenamento, vale só para esta sessão.
      }
    },
    [lembrar],
  );

  return [fechadas, guardar];
}

function ler(): Record<string, boolean> {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return {};

    const dados: unknown = JSON.parse(bruto);
    if (!dados || typeof dados !== "object") return {};

    return Object.fromEntries(
      Object.entries(dados as Record<string, unknown>).map(([id, valor]) => [
        id,
        Boolean(valor),
      ]),
    );
  } catch {
    return {};
  }
}
