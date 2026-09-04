import { useEffect } from "react";

import { useReadStates } from "~/@core/application/queries/message/use-read-states";
import { useAvisos } from "~/stores/notificacoes";

const BASE = "Gravaê";

export function useAvisoNoTitulo(ativo: boolean) {
  const { data: readStates } = useReadStates(ativo);
  const contador = useAvisos((s) => s.contador);

  useEffect(() => {
    if (!ativo || !contador) {
      document.title = BASE;
      void window.gravae?.janela?.contador(0);
      return;
    }

    const estados = Object.values(readStates ?? {});
    const mencoes = estados.reduce((total, e) => total + e.mencoes, 0);
    const naoLidas = estados.reduce((total, e) => total + e.naoLidas, 0);

    document.title = mencoes ? `(${mencoes}) ${BASE}` : naoLidas ? `• ${BASE}` : BASE;
    void window.gravae?.janela?.contador(mencoes);
  }, [ativo, contador, readStates]);

  useEffect(
    () => () => {
      document.title = BASE;
      void window.gravae?.janela?.contador(0);
    },
    [],
  );
}
