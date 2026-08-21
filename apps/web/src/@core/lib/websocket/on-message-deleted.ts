import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type MessageDeletedFunc = ServerToClientEvents["message:deleted"];

export const onMessageDeleted = (func: MessageDeletedFunc) => {
  socket()?.on("message:deleted", func);
};

export const offMessageDeleted = (func?: MessageDeletedFunc) => {
  socket()?.off("message:deleted", func);
};
