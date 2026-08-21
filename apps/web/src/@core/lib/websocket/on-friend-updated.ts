import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type FriendUpdatedFunc = ServerToClientEvents["friend:updated"];

export const onFriendUpdated = (func: FriendUpdatedFunc) => {
  socket()?.on("friend:updated", func);
};

export const offFriendUpdated = (func?: FriendUpdatedFunc) => {
  socket()?.off("friend:updated", func);
};
