import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type VoiceRefusedFunc = ServerToClientEvents["voice:recusada"];

export const onVoiceRefused = (func: VoiceRefusedFunc) => {
  socket()?.on("voice:recusada", func);
};

export const offVoiceRefused = (func?: VoiceRefusedFunc) => {
  socket()?.off("voice:recusada", func);
};
