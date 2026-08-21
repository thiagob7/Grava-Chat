import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type MessageCreatedFunc = ServerToClientEvents["message:created"];

export const onMessageCreated = (func: MessageCreatedFunc) => {
  socket()?.on("message:created", func);
};

export const offMessageCreated = (func?: MessageCreatedFunc) => {
  socket()?.off("message:created", func);
};
