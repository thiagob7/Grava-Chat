import type { ClientEventPayload, VoiceDevice } from "@gravae/shared";

import { emit } from ".";

export const joinVoiceChannel = (
  channelId: string,
  resume = false,
  client?: string,
  device?: VoiceDevice,
) =>
  emit("voice:join", {
    channelId,
    resume,
    ...(client ? { client } : null),
    ...(device ? { device } : null),
  });
export const leaveVoiceChannel = () => emit("voice:leave", {});
export const updateVoiceState = (patch: ClientEventPayload<"voice:state">) =>
  emit("voice:state", patch);

export const moderateVoice = (payload: {
  userId: string;
  fromChannelId?: string;
  serverMute?: boolean;
  serverDeaf?: boolean;
}) => emit("voice:moderate", payload);

export const kickFromVoice = (userId: string, fromChannelId?: string) =>
  emit("voice:kick", { userId, ...(fromChannelId ? { fromChannelId } : null) });

export const refuseCall = (channelId: string) => emit("voice:recusar", { channelId });

export const moveMember = (userId: string, channelId: string, fromChannelId?: string) =>
  emit("voice:moveMember", { userId, channelId, ...(fromChannelId ? { fromChannelId } : null) });

export const playSound = (soundId: string) => emit("voice:sound", { soundId });
