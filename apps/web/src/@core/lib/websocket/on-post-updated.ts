import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type PostUpdatedFunc = ServerToClientEvents["post:updated"];

export const onPostUpdated = (func: PostUpdatedFunc) => {
  socket()?.on("post:updated", func);
};

export const offPostUpdated = (func?: PostUpdatedFunc) => {
  socket()?.off("post:updated", func);
};
