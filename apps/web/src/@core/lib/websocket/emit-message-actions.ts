import type { ClientEventPayload, DesiredStatus } from "@gravae/shared";

import { emit } from ".";

export const editMessage = (payload: ClientEventPayload<"message:edit">) =>
  emit("message:edit", payload);

export const deleteMessage = (messageId: string) => emit("message:delete", { messageId });

export const reactToMessage = (messageId: string, emoji: string, add: boolean) =>
  emit(add ? "message:react" : "message:unreact", { messageId, emoji });

export const votePoll = (messageId: string, optionId: string) =>
  emit("poll:vote", { messageId, optionId });

export const closePoll = (messageId: string) => emit("poll:close", { messageId });

export const ackMessage = (channelId: string, messageId: string) =>
  emit("message:ack", { channelId, messageId });

export const startTyping = (channelId: string) => emit("typing:start", { channelId });

/**
 * O status que você ESCOLHE. `INVISIBLE` também vem por aqui — é um estado
 * desejado, e quem traduz pra o que os outros veem (`OFFLINE`) é o servidor.
 */
export const updatePresence = (status: DesiredStatus) => emit("presence:update", { status });

/** Ausência detectada aqui no cliente. Não mexe no status escolhido. */
export const marcarAusente = (idle: boolean) => emit("presence:afk", { idle });
