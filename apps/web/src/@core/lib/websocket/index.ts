import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, MotivoDeFalha, ServerToClientEvents } from "@gravae/shared";

import { getAccessToken } from "~/@core/lib/api";

const comMotivo = (mensagem: string, motivo: MotivoDeFalha) =>
  Object.assign(new Error(mensagem), { motivo });

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
      reject(comMotivo("Sem conexão com o servidor", "sem-conexao"));
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
      () => reject(comMotivo("O servidor não respondeu", "sem-conexao")),
      10_000,
    );

    (
      s.emit as (
        e: string,
        p: unknown,
        ack: (r: { ok: boolean; data?: unknown; error?: string; motivo?: MotivoDeFalha }) => void,
      ) => void
    )(event as string, payload, (res) => {
      clearTimeout(timer);
      res.ok ? resolve(res.data) : reject(comMotivo(res.error ?? "Erro", res.motivo ?? "erro"));
    });
  });
}
