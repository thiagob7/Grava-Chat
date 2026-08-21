import type { ClientEventPayload } from "@gravae/shared";

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

export const updatePresence = (status: "ONLINE" | "IDLE" | "DND") =>
  emit("presence:update", { status });
