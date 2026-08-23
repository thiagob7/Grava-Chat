import { useEffect, useRef } from "react";

import { marcarAusente } from "~/@core/lib/websocket/emit-message-actions";

/** Dez minutos parado. O mesmo tempo do Discord. */
const OCIOSO_MS = 10 * 60_000;

/** Eventos que provam que TEM alguém aí — não só uma aba aberta. */
const SINAIS = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;

/**
 * Ausência automática, detectada AQUI no cliente.
 *
 * O servidor não enxerga ociosidade: o ping do Socket.IO prova que a aba está
 * viva, não que a pessoa está. Só o navegador sabe que faz dez minutos que
 * ninguém encosta no teclado.
 *
 * Vai numa chave separada do status manual (`presence:afk`, não
 * `presence:update`): se fosse a mesma, voltar do ausente esqueceria que você
 * estava em Não Perturbe. Quem decide o que ganha é o servidor — e lá o DND
 * ganha do ausente automático.
 *
 * A aba escondida NÃO conta como ausência: quem está lendo num monitor e
 * escrevendo no outro tem o app fora de foco o tempo todo, e ficaria ausente
 * enquanto conversa.
 */
export function useAusencia(ligado: boolean) {
  const ausente = useRef(false);

  useEffect(() => {
    if (!ligado) return;

    let timer: ReturnType<typeof setTimeout>;

    const avisar = (idle: boolean) => {
      if (ausente.current === idle) return;

      ausente.current = idle;
      void marcarAusente(idle).catch(() => undefined);
    };

    const reiniciar = () => {
      avisar(false);
      clearTimeout(timer);
      timer = setTimeout(() => avisar(true), OCIOSO_MS);
    };

    reiniciar();
    for (const evento of SINAIS) window.addEventListener(evento, reiniciar, { passive: true });

    return () => {
      clearTimeout(timer);
      for (const evento of SINAIS) window.removeEventListener(evento, reiniciar);
      // ao desmontar, desfaz a marca: senão a próxima sessão começa ausente
      if (ausente.current) void marcarAusente(false).catch(() => undefined);
    };
  }, [ligado]);
}
