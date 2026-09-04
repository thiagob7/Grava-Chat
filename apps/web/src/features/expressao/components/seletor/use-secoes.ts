import { useCallback, useRef, useState } from "react";

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
