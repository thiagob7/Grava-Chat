import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type ExpressionsChangedFunc = ServerToClientEvents["expressions:changed"];

export const onExpressionsChanged = (func: ExpressionsChangedFunc) => {
  socket()?.on("expressions:changed", func);
};

export const offExpressionsChanged = (func?: ExpressionsChangedFunc) => {
  socket()?.off("expressions:changed", func);
};
