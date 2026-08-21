import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type ChannelDeletedFunc = ServerToClientEvents["channel:deleted"];

export const onChannelDeleted = (func: ChannelDeletedFunc) => {
  socket()?.on("channel:deleted", func);
};

export const offChannelDeleted = (func?: ChannelDeletedFunc) => {
  socket()?.off("channel:deleted", func);
};
