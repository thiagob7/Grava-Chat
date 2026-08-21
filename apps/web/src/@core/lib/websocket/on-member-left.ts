import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type MemberLeftFunc = ServerToClientEvents["member:left"];

export const onMemberLeft = (func: MemberLeftFunc) => {
  socket()?.on("member:left", func);
};

export const offMemberLeft = (func?: MemberLeftFunc) => {
  socket()?.off("member:left", func);
};
