import type { ClientEventPayload } from "@gravae/shared";

import { emit } from ".";

export const joinVoiceChannel = (channelId: string, resume = false) =>
  emit("voice:join", { channelId, resume });
export const leaveVoiceChannel = () => emit("voice:leave", {});
export const updateVoiceState = (patch: ClientEventPayload<"voice:state">) =>
  emit("voice:state", patch);

/** Moderação de voz — o servidor confere a permissão antes de aplicar no SFU. */
export const moderateVoice = (payload: {
  userId: string;
  serverMute?: boolean;
  serverDeaf?: boolean;
}) => emit("voice:moderate", payload);

export const kickFromVoice = (userId: string) => emit("voice:kick", { userId });

export const moveMember = (userId: string, channelId: string) =>
  emit("voice:moveMember", { userId, channelId });

/** Toca um efeito sonoro para todo mundo que está na chamada. */
export const playSound = (soundId: string) => emit("voice:sound", { soundId });
