import type { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@gravae/shared";

export type GravaeServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export type SocketData = {
  userId: string;
  /** servidores do usuario, resolvidos no handshake */
  guildIds: string[];
  /** canal de voz atual, se houver — usado na Fase 3 */
  voiceChannelId: string | null;
};

let instance: GravaeServer | null = null;

export function setIo(server: GravaeServer) {
  instance = server;
}

/**
 * Acesso ao Socket.IO a partir das rotas REST (criar canal, aceitar convite...).
 * Passar o `io` como parametro por toda a arvore de rotas polui muito mais do
 * que este acessor.
 */
export function io(): GravaeServer {
  if (!instance) throw new Error("Socket.IO ainda não foi inicializado");
  return instance;
}
