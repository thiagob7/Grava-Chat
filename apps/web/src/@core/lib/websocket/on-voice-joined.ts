import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type VoiceJoinedFunc = ServerToClientEvents["voice:joined"];

export const onVoiceJoined = (func: VoiceJoinedFunc) => {
  socket()?.on("voice:joined", func);
};

export const offVoiceJoined = (func?: VoiceJoinedFunc) => {
  socket()?.off("voice:joined", func);
};
