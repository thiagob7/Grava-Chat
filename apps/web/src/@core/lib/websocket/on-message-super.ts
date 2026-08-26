import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type MessageSuperFunc = ServerToClientEvents["message:super"];

export const onMessageSuper = (func: MessageSuperFunc) => {
  socket()?.on("message:super", func);
};

export const offMessageSuper = (func?: MessageSuperFunc) => {
  socket()?.off("message:super", func);
};
