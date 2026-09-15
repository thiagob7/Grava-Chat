import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type InteractionModalFunc = ServerToClientEvents["interaction:modal"];
export type InteractionModalPayload = Parameters<InteractionModalFunc>[0];

export const onInteractionModal = (func: InteractionModalFunc) => {
  socket()?.on("interaction:modal", func);
};

export const offInteractionModal = (func?: InteractionModalFunc) => {
  socket()?.off("interaction:modal", func);
};
