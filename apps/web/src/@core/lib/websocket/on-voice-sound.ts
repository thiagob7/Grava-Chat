import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type VoiceSoundFunc = ServerToClientEvents["voice:sound"];

export const onVoiceSound = (func: VoiceSoundFunc) => {
  socket()?.on("voice:sound", func);
};

export const offVoiceSound = (func?: VoiceSoundFunc) => {
  socket()?.off("voice:sound", func);
};
