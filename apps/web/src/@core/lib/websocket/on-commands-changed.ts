import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type CommandsChangedFunc = ServerToClientEvents["commands:changed"];

export const onCommandsChanged = (func: CommandsChangedFunc) => {
  socket()?.on("commands:changed", func);
};

export const offCommandsChanged = (func?: CommandsChangedFunc) => {
  socket()?.off("commands:changed", func);
};
