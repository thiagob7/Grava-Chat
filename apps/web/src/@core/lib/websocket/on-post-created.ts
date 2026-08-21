import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type PostCreatedFunc = ServerToClientEvents["post:created"];

export const onPostCreated = (func: PostCreatedFunc) => {
  socket()?.on("post:created", func);
};

export const offPostCreated = (func?: PostCreatedFunc) => {
  socket()?.off("post:created", func);
};
