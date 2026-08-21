import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type PresenceChangedFunc = ServerToClientEvents["presence:changed"];

export const onPresenceChanged = (func: PresenceChangedFunc) => {
  socket()?.on("presence:changed", func);
};

export const offPresenceChanged = (func?: PresenceChangedFunc) => {
  socket()?.off("presence:changed", func);
};
