import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, FailureReason, ServerToClientEvents } from "@gravae/shared";

import { getAccessToken } from "~/@core/lib/api";
import { comNomesNovos } from "~/@core/lib/api-mais-velha";

const withReason = (message: string, reason: FailureReason) =>
  Object.assign(new Error(message), { reason });

export type GravaeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const URL = import.meta.env.VITE_WS_URL ?? "";

let instance: GravaeSocket | null = null;

export function connectSocket(): GravaeSocket {
  instance ??= io(URL || window.location.origin, {
    transports: ["websocket"],
    auth: (cb) => cb({ token: getAccessToken() }),
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
  });

  /*
    O mesmo acerto do corpo HTTP vale aqui: o evento chega da API, e ela pode
    estar uma publicação atrás do web. Renomear na porta de entrada é mais
    barato do que espalhar checagem por cada `on`.

    `onevent` é o ponto por onde o pacote entra antes de virar chamada de
    ouvinte. `onAny` não serve: ele recebe uma cópia dos argumentos, e mexer
    nela não muda o que o `on` vê.
  */
  const entrada = instance as unknown as {
    onevent: (pacote: { data?: unknown[] }) => void;
  };
  const original = entrada.onevent.bind(entrada);

  entrada.onevent = (pacote) => {
    if (Array.isArray(pacote.data)) {
      pacote.data = [pacote.data[0], ...pacote.data.slice(1).map(comNomesNovos)];
    }
    original(pacote);
  };

  return instance;
}

export function disconnectSocket() {
  instance?.disconnect();
  instance = null;
}

export const socket = () => instance;

function whenConnected(timeoutMs = 10_000): Promise<GravaeSocket> {
  const s = instance ?? connectSocket();
  if (s.connected) return Promise.resolve(s);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      s.off("connect", onConnect);
      reject(withReason("Sem conexão com o servidor", "sem-conexao"));
    }, timeoutMs);

    const onConnect = () => {
      clearTimeout(timer);
      resolve(s);
    };

    s.once("connect", onConnect);
  });
}

export async function emit<E extends keyof ClientToServerEvents>(
  event: E,
  payload: Parameters<ClientToServerEvents[E]>[0],
): Promise<unknown> {
  const s = await whenConnected();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(withReason("O servidor não respondeu", "sem-conexao")),
      10_000,
    );

    (
      s.emit as (
        e: string,
        p: unknown,
        ack: (r: { ok: boolean; data?: unknown; error?: string; reason?: FailureReason }) => void,
      ) => void
    )(event as string, payload, (res) => {
      clearTimeout(timer);
      res.ok ? resolve(res.data) : reject(withReason(res.error ?? "Erro", res.reason ?? "erro"));
    });
  });
}
