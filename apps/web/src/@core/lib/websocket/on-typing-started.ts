import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type TypingStartedFunc = ServerToClientEvents["typing:started"];

export const onTypingStarted = (func: TypingStartedFunc) => {
  socket()?.on("typing:started", func);
};

export const offTypingStarted = (func?: TypingStartedFunc) => {
  socket()?.off("typing:started", func);
};
