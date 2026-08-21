import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type DmCreatedFunc = ServerToClientEvents["dm:created"];

export const onDmCreated = (func: DmCreatedFunc) => {
  socket()?.on("dm:created", func);
};

export const offDmCreated = (func?: DmCreatedFunc) => {
  socket()?.off("dm:created", func);
};
