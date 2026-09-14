import type { Server } from "socket.io";
import type { ClientToServerEvents, PresenceStatus, ServerToClientEvents } from "@gravae/shared";

export type GravaeServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export type SocketData = {
  userId: string;
  guildIds: string[];
  voiceChannelId: string | null;
  isBot?: boolean;
  presenceOnConnect?: PresenceStatus | null;
};

let instance: GravaeServer | null = null;

export function setIo(server: GravaeServer) {
  instance = server;
}

export function ioIfReady(): GravaeServer | null {
  return instance;
}

export function io(): GravaeServer {
  if (!instance) throw new Error("Socket.IO ainda não foi inicializado");
  return instance;
}

export async function closeIo() {
  if (!instance) return;

  instance.disconnectSockets(true);
  await new Promise<void>((resolve) => instance!.close(() => resolve()));
  instance = null;
}
