import type { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@gravae/shared";

export type GravaeServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export type SocketData = {
  userId: string;
  guildIds: string[];
  voiceChannelId: string | null;
  ehBot?: boolean;
};

let instance: GravaeServer | null = null;

export function setIo(server: GravaeServer) {
  instance = server;
}

export function io(): GravaeServer {
  if (!instance) throw new Error("Socket.IO ainda não foi inicializado");
  return instance;
}

/*
  Derruba as conexões abertas e fecha o gateway.

  Sem isto, o `close()` do Fastify espera por WebSocket que nunca fecha
  sozinho — navegador aberto do outro lado não tem por que desistir. O
  systemd então esperava o tempo dele, desistia e matava no SIGKILL: 90
  segundos de 502 a cada publicação.
*/
export async function fecharIo() {
  if (!instance) return;

  instance.disconnectSockets(true);
  await new Promise<void>((resolve) => instance!.close(() => resolve()));
  instance = null;
}
