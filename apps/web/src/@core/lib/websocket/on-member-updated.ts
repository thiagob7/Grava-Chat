import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type MemberUpdatedFunc = ServerToClientEvents["member:updated"];

export const onMemberUpdated = (func: MemberUpdatedFunc) => {
  socket()?.on("member:updated", func);
};

export const offMemberUpdated = (func?: MemberUpdatedFunc) => {
  socket()?.off("member:updated", func);
};
