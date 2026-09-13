import { useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

import type { MessagePageModel, PendingMessageModel } from "~/@core/domain/models/message-model";
import { queryKeys } from "~/@core/infra/constants/query-keys";

import { sendQueue } from "~/@core/infra/cache/fila-de-envio";
import { sendMessage } from "~/@core/lib/websocket/send-message";
import { useConnectionStore } from "~/features/app/stores/conexao-store";
import { failureReason } from "~/features/conversa/lib/falha-de-envio";
import { stopsWholeQueue, waitBeforeTry, worthQueueing } from "~/features/conversa/lib/fila-de-saida";

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

/*
  O vigia da prateleira.

  A gaveta guarda a mensagem; é este quem leva ao correio quando a rua
  desentope. Ele acorda quando o socket conecta — o que inclui a abertura do
  aplicativo, porque conectar pela primeira vez também é conectar.

  Três decisões que valem explicar.

  UMA DE CADA VEZ, NA ORDEM EM QUE FORAM ESCRITAS. Disparar tudo junto
  embaralharia a conversa: quem escreveu três frases sem sinal veria elas
  chegando fora de ordem do outro lado. E rajada é justamente o que derruba a
  conexão que acabou de voltar.

  ESPERA CRESCENTE ENTRE FALHAS. Wi-Fi que voltou costuma piscar de novo. Sem
  a espera, a fila inteira gastaria as dez tentativas num minuto de instabilidade
  e desistiria de mensagens que sairiam bem daqui a pouco.

  PARA NA PRIMEIRA QUEDA DE REDE. Se uma falhou por falta de rede, as seguintes
  vão falhar igual. Falha de um canal só (modo lento, limite de fluxo) segura as
  daquele canal e deixa as outras seguirem.

  ACORDA SOZINHO. Além de conectar, ele acorda quando entra mensagem nova na
  fila e alguns segundos depois de uma volta que deixou sobra — modo lento
  acontece com a conexão boa, e esperar a rede cair para tentar de novo era
  deixar a mensagem parada à toa.

  UMA VOLTA DE CADA VEZ. As voltas entram numa corrente de promessas: a nova só
  começa quando a anterior terminou. A trava antiga, uma flag, ficava presa
  quando a conexão caía e voltava no meio de uma espera, e a fila parava até a
  reconexão seguinte.

  O reenvio é seguro porque o servidor guarda recibo por `nonce`: se a mensagem
  já tinha chegado antes da rede cair, ele devolve a que existe em vez de criar
  outra.
*/
const LEFTOVER_MS = 5_000;

type MessagesCache = { pages: MessagePageModel[]; pageParams: unknown[] } | undefined;

/* Tira o relógio da mensagem que não vai mais sair, e mostra o motivo no lugar. */
function markFailed(client: QueryClient, channelId: string, nonce: string, reason: PendingMessageModel["reason"]) {
  client.setQueryData(queryKeys.channel.messages(channelId), (old: MessagesCache) =>
    old && {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        messages: page.messages.map((m) =>
          (m as PendingMessageModel).nonce === nonce
            ? { ...m, queued: undefined, failed: true as const, reason }
            : m,
        ),
      })),
    },
  );
}

export function useSendQueue() {
  const connected = useConnectionStore((s) => s.connected);
  const client = useQueryClient();
  const [wake, setWake] = useState(0);
  const chain = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => sendQueue.onPut(() => setWake((n) => n + 1)), []);

  useEffect(() => {
    if (!connected || !sendQueue.available()) return;

    let alive = true;
    let later: ReturnType<typeof setTimeout> | undefined;

    const drain = async () => {
      if (!alive) return;

      /* Primeiro joga fora o que não vai mais sair, para não tentar à toa. */
      await sendQueue.prune();

      const held = new Set<string>();
      let leftover = false;

      for (const item of await sendQueue.list()) {
        if (!alive) return;

        if (held.has(item.channelId)) {
          leftover = true;
          continue;
        }

        const waiting = waitBeforeTry(item.tries);
        if (waiting) await sleep(waiting);
        if (!alive) return;

        try {
          await sendMessage({ ...(item.payload as Parameters<typeof sendMessage>[0]), retry: true });
          await sendQueue.take(item.nonce);
        } catch (error) {
          const reason = failureReason(error);

          if (!worthQueueing(reason)) {
            await sendQueue.take(item.nonce);
            markFailed(client, item.channelId, item.nonce, reason);
            continue;
          }

          await sendQueue.tried(item.nonce);
          if (stopsWholeQueue(reason)) return;

          held.add(item.channelId);
          leftover = true;
        }
      }

      if (leftover && alive) later = setTimeout(() => setWake((n) => n + 1), LEFTOVER_MS);
    };

    chain.current = chain.current.then(drain).catch(() => undefined);

    return () => {
      alive = false;
      clearTimeout(later);
    };
  }, [connected, wake, client]);
}
