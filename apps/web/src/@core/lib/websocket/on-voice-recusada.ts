import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type VoiceRecusadaFunc = ServerToClientEvents["voice:recusada"];

export const onVoiceRecusada = (func: VoiceRecusadaFunc) => {
  socket()?.on("voice:recusada", func);
};

export const offVoiceRecusada = (func?: VoiceRecusadaFunc) => {
  socket()?.off("voice:recusada", func);
};
