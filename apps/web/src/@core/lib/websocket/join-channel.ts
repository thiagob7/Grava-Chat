import { emit } from ".";

/**
 * As salas do Socket.IO vivem no servidor e somem quando o socket cai — por
 * isso é preciso reinscrever a cada reconexão, não só ao abrir o canal.
 */
export const joinChannel = (channelId: string) => emit("channel:subscribe", { channelId });
