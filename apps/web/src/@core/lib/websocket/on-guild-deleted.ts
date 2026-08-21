import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type GuildDeletedFunc = ServerToClientEvents["guild:deleted"];

export const onGuildDeleted = (func: GuildDeletedFunc) => {
  socket()?.on("guild:deleted", func);
};

export const offGuildDeleted = (func?: GuildDeletedFunc) => {
  socket()?.off("guild:deleted", func);
};
