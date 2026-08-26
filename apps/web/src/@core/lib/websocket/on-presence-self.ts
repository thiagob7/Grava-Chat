import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type PresenceSelfFunc = ServerToClientEvents["presence:self"];

export const onPresenceSelf = (func: PresenceSelfFunc) => {
  socket()?.on("presence:self", func);
};

export const offPresenceSelf = (func?: PresenceSelfFunc) => {
  socket()?.off("presence:self", func);
};
