import { useEffect, useRef } from "react";

import { ATALHOS, eventoCombina } from "~/features/configuracoes/lib/atalhos";
import { useAtalhos } from "~/features/configuracoes/stores/atalhos";

export function useAtalhoGlobal(id: string, acao: () => void) {
  const trocados = useAtalhos((s) => s.trocados);
  const desligados = useAtalhos((s) => s.desligados);

  const ultimaAcao = useRef(acao);
  ultimaAcao.current = acao;

  useEffect(() => {
    const atalho = ATALHOS.find((a) => a.id === id);
    if (!atalho || desligados.includes(id)) return;

    const combo = trocados[id] ?? atalho.padrao;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (!eventoCombina(evento, combo)) return;

      evento.preventDefault();
      ultimaAcao.current();
    };

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [id, trocados, desligados]);
}
