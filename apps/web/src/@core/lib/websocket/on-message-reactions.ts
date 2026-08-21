import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type MessageReactionsFunc = ServerToClientEvents["message:reactions"];

export const onMessageReactions = (func: MessageReactionsFunc) => {
  socket()?.on("message:reactions", func);
};

export const offMessageReactions = (func?: MessageReactionsFunc) => {
  socket()?.off("message:reactions", func);
};
