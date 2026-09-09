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

export async function fecharIo() {
  if (!instance) return;

  instance.disconnectSockets(true);
  await new Promise<void>((resolve) => instance!.close(() => resolve()));
  instance = null;
}
