import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type ChannelUpdatedFunc = ServerToClientEvents["channel:updated"];

export const onChannelUpdated = (func: ChannelUpdatedFunc) => {
  socket()?.on("channel:updated", func);
};

export const offChannelUpdated = (func?: ChannelUpdatedFunc) => {
  socket()?.off("channel:updated", func);
};
