import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type GuildUpdatedFunc = ServerToClientEvents["guild:updated"];

export const onGuildUpdated = (func: GuildUpdatedFunc) => {
  socket()?.on("guild:updated", func);
};

export const offGuildUpdated = (func?: GuildUpdatedFunc) => {
  socket()?.off("guild:updated", func);
};
