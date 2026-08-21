import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type VoiceUpdatedFunc = ServerToClientEvents["voice:updated"];

export const onVoiceUpdated = (func: VoiceUpdatedFunc) => {
  socket()?.on("voice:updated", func);
};

export const offVoiceUpdated = (func?: VoiceUpdatedFunc) => {
  socket()?.off("voice:updated", func);
};
