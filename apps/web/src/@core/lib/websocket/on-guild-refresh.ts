import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type GuildRefreshFunc = ServerToClientEvents["guild:refresh"];

export const onGuildRefresh = (func: GuildRefreshFunc) => {
  socket()?.on("guild:refresh", func);
};

export const offGuildRefresh = (func?: GuildRefreshFunc) => {
  socket()?.off("guild:refresh", func);
};
