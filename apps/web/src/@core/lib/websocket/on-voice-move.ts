import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type VoiceMoveFunc = ServerToClientEvents["voice:move"];

export const onVoiceMove = (func: VoiceMoveFunc) => {
  socket()?.on("voice:move", func);
};

export const offVoiceMove = (func?: VoiceMoveFunc) => {
  socket()?.off("voice:move", func);
};
