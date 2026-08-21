import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type MemberJoinedFunc = ServerToClientEvents["member:joined"];

export const onMemberJoined = (func: MemberJoinedFunc) => {
  socket()?.on("member:joined", func);
};

export const offMemberJoined = (func?: MemberJoinedFunc) => {
  socket()?.off("member:joined", func);
};
