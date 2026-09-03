import { useCallback, useEffect, useState } from "react";

import { useAparencia } from "~/stores/aparencia";

const CHAVE = "gravae:categorias-fechadas";

/**
 * Quais categorias da lista de canais estão fechadas — e se isso sobrevive.
 *
 * Antes era um `useState` puro: fechar uma categoria durava até a próxima
 * recarga, e aí tudo voltava aberto. Fechar uma categoria é uma decisão, e o
 * app refazê-la sozinho é o app esquecendo o que a pessoa acabou de dizer.
 *
 * Fica no aparelho, e não na conta, pelo mesmo motivo do tema: quem usa o app
 * no monitor grande e no notebook não quer a mesma lista fechada nos dois.
 *
 * Quem desliga a lembrança continua podendo fechar categoria — só não leva a
 * escolha para a próxima sessão. Por isso a leitura respeita a preferência e a
 * escrita também: desligar e continuar gravando seria guardar às escondidas.
 */
export function useCategoriasFechadas(): [
  Record<string, boolean>,
  (proximo: Record<string, boolean>) => void,
] {
  const lembrar = useAparencia((s) => s.lembrarCategoriasFechadas);
  const [fechadas, setFechadas] = useState<Record<string, boolean>>(() =>
    lembrar ? ler() : {},
  );

  /*
    Ligar a lembrança no meio da sessão traz de volta o que estava guardado;
    desligar apaga. Sem apagar, o valor antigo ficaria no `localStorage`
    esperando para ressuscitar no dia em que alguém religasse — uma memória que
    a pessoa achava ter apagado.
  */
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
        /// Só o que está FECHADO vai pro disco: guardar os `false` faria o
        /// registro crescer com toda categoria que alguém já abriu.
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
