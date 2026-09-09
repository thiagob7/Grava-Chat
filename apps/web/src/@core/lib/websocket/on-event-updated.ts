import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type EventUpdatedFunc = ServerToClientEvents["event:updated"];

export const onEventUpdated = (func: EventUpdatedFunc) => {
  socket()?.on("event:updated", func);
};

export const offEventUpdated = (func?: EventUpdatedFunc) => {
  socket()?.off("event:updated", func);
};
