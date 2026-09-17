import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type InteractionFinishedFunc = ServerToClientEvents["interaction:finished"];

export const onInteractionFinished = (func: InteractionFinishedFunc) => {
  socket()?.on("interaction:finished", func);
};

export const offInteractionFinished = (func?: InteractionFinishedFunc) => {
  socket()?.off("interaction:finished", func);
};
