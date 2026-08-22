import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type UserUpdatedFunc = ServerToClientEvents["user:updated"];

export const onUserUpdated = (func: UserUpdatedFunc) => {
  socket()?.on("user:updated", func);
};

export const offUserUpdated = (func?: UserUpdatedFunc) => {
  socket()?.off("user:updated", func);
};
