import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type DmRequestFunc = ServerToClientEvents["dm:pedido"];

export const onDmRequest = (func: DmRequestFunc) => {
  socket()?.on("dm:pedido", func);
};

export const offDmRequest = (func?: DmRequestFunc) => {
  socket()?.off("dm:pedido", func);
};
