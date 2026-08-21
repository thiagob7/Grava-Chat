import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type VoiceLeftFunc = ServerToClientEvents["voice:left"];

export const onVoiceLeft = (func: VoiceLeftFunc) => {
  socket()?.on("voice:left", func);
};

export const offVoiceLeft = (func?: VoiceLeftFunc) => {
  socket()?.off("voice:left", func);
};
