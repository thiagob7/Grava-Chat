import { useEffect } from "react";

import { useReadStates } from "~/@core/application/queries/message/use-read-states";
import { useAvisos } from "~/stores/notificacoes";

const BASE = "Gravaê";

/**
 * O contador no título da aba e no ícone do app.
 *
 * É o aviso que funciona quando todo o resto foi negado: sem permissão de
 * notificação, com o som desligado, com a janela atrás de tudo — o número na
 * aba continua lá. Por isso ele não depende de nada além do que já sabemos
 * (os não-lidos que o servidor devolve).
 *
 * Menção vira número; não-lido sem menção vira só um ponto, porque "23" numa
 * aba para um canal movimentado é ruído, e o ponto já diz "tem coisa nova".
 */
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

  /// Sair da conta (ou fechar a aba) não pode deixar o balãozinho no Dock.
  useEffect(
    () => () => {
      document.title = BASE;
      void window.gravae?.janela?.contador(0);
    },
    [],
  );
}
