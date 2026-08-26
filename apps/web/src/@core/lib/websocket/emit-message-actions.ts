import type { ClientEventPayload, DesiredStatus } from "@gravae/shared";

import { emit } from ".";

export const editMessage = (payload: ClientEventPayload<"message:edit">) =>
  emit("message:edit", payload);

export const deleteMessage = (messageId: string) => emit("message:delete", { messageId });

export const reactToMessage = (messageId: string, emoji: string, add: boolean, burst = false) =>
  add
    ? emit("message:react", { messageId, emoji, burst })
    : emit("message:unreact", { messageId, emoji });

export const votePoll = (messageId: string, optionId: string) =>
  emit("poll:vote", { messageId, optionId });

export const closePoll = (messageId: string) => emit("poll:close", { messageId });

export const ackMessage = (channelId: string, messageId: string) =>
  emit("message:ack", { channelId, messageId });

/// deixa o canal não-lido a partir desta mensagem
export const unreadFromMessage = (channelId: string, messageId: string) =>
  emit("message:unread", { channelId, messageId });

export const startTyping = (channelId: string) => emit("typing:start", { channelId });

/// Um comando de barra. O `ack` volta com o id da mensagem "fulano usou
/// /play" — e um erro quando o servidor recusa, que é onde a validação das
/// opções acontece.
export const invocarComando = (payload: ClientEventPayload<"command:invoke">) =>
  emit("command:invoke", payload);

export const updatePresence = (status: DesiredStatus) => emit("presence:update", { status });

export const marcarAusente = (idle: boolean) => emit("presence:afk", { idle });
