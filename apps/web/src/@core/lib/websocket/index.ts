import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@gravae/shared";

import { getAccessToken } from "~/@core/lib/api";

export type GravaeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Vazio = mesma origem, passando pelo proxy do Vite (ver vite.config.ts). */
const URL = import.meta.env.VITE_WS_URL ?? "";

let instance: GravaeSocket | null = null;

export function connectSocket(): GravaeSocket {
  instance ??= io(URL || window.location.origin, {
    transports: ["websocket"],
    /**
     * Lê o token na hora de cada tentativa. Numa reconexão depois de o token
     * ter expirado e sido renovado, uma referência fixa mandaria o antigo.
     */
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

/** Espera a conexão existir antes de emitir. */
function whenConnected(timeoutMs = 10_000): Promise<GravaeSocket> {
  const s = instance ?? connectSocket();
  if (s.connected) return Promise.resolve(s);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      s.off("connect", onConnect);
      reject(new Error("Sem conexão com o servidor"));
    }, timeoutMs);

    const onConnect = () => {
      clearTimeout(timer);
      resolve(s);
    };

    s.once("connect", onConnect);
  });
}

/**
 * Emite esperando o ack do servidor. Todo handler responde `{ok:true,data}` ou
 * `{ok:false,error}`, então aqui a falha vira exceção.
 */
export async function emit<E extends keyof ClientToServerEvents>(
  event: E,
  payload: Parameters<ClientToServerEvents[E]>[0],
): Promise<unknown> {
  const s = await whenConnected();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("O servidor não respondeu")), 10_000);

    (
      s.emit as (
        e: string,
        p: unknown,
        ack: (r: { ok: boolean; data?: unknown; error?: string }) => void,
      ) => void
    )(event as string, payload, (res) => {
      clearTimeout(timer);
      res.ok ? resolve(res.data) : reject(new Error(res.error ?? "Erro"));
    });
  });
}
