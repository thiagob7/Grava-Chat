import { useCallback, useRef, useState } from "react";

/**
 * Liga a coluna de atalhos à lista rolável: clicar leva até a seção, e rolar
 * atualiza qual atalho aparece aceso.
 *
 * O ativo é a última seção cujo topo já passou do topo do que se vê. Usar a
 * primeira visível daria errado no fim da lista, onde a última seção pode ser
 * curta demais para chegar ao topo e o atalho nunca acenderia.
 */
export function useSecoes(inicial: string | null = null) {
  const container = useRef<HTMLDivElement | null>(null);
  const secoes = useRef(new Map<string, HTMLElement>());
  const [ativo, setAtivo] = useState<string | null>(inicial);

  const registrar = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) secoes.current.set(id, el);
      else secoes.current.delete(id);
    },
    [],
  );

  /// O salto é seco, sem `behavior: "smooth"`. O Chrome estica a duração da
  /// rolagem suave conforme a distância, e daqui até "bandeiras" são milhares
  /// de pixels: levava segundos, e no caminho o atalho aceso passeava por
  /// todas as categorias. Clicar num atalho tem que chegar lá agora.
  const irPara = useCallback((id: string) => {
    const alvo = secoes.current.get(id);
    if (!alvo || !container.current) return;

    container.current.scrollTop = alvo.offsetTop;
    setAtivo(id);
  }, []);

  const aoRolar = useCallback(() => {
    const el = container.current;
    if (!el) return;

    const limite = el.scrollTop + 12;
    let atual: string | null = null;

    for (const [id, secao] of secoes.current) {
      if (secao.offsetTop <= limite) atual = id;
    }

    setAtivo(atual ?? secoes.current.keys().next().value ?? null);
  }, []);

  return { container, registrar, irPara, aoRolar, ativo };
}
