import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type SocketErrorFunc = ServerToClientEvents["error"];

export const onSocketError = (func: SocketErrorFunc) => {
  socket()?.on("error", func);
};

export const offSocketError = (func?: SocketErrorFunc) => {
  socket()?.off("error", func);
};
