import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type ChannelCreatedFunc = ServerToClientEvents["channel:created"];

export const onChannelCreated = (func: ChannelCreatedFunc) => {
  socket()?.on("channel:created", func);
};

export const offChannelCreated = (func?: ChannelCreatedFunc) => {
  socket()?.off("channel:created", func);
};
