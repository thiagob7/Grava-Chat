import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type MessageUpdatedFunc = ServerToClientEvents["message:updated"];

export const onMessageUpdated = (func: MessageUpdatedFunc) => {
  socket()?.on("message:updated", func);
};

export const offMessageUpdated = (func?: MessageUpdatedFunc) => {
  socket()?.off("message:updated", func);
};
