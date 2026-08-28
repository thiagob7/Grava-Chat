import type { ClientEventPayload } from "@gravae/shared";

import { emit } from ".";

export const joinVoiceChannel = (channelId: string, resume = false, cliente?: string) =>
  emit("voice:join", { channelId, resume, ...(cliente ? { cliente } : null) });
export const leaveVoiceChannel = () => emit("voice:leave", {});
export const updateVoiceState = (patch: ClientEventPayload<"voice:state">) =>
  emit("voice:state", patch);

export const moderateVoice = (payload: {
  userId: string;
  serverMute?: boolean;
  serverDeaf?: boolean;
}) => emit("voice:moderate", payload);

export const kickFromVoice = (userId: string) => emit("voice:kick", { userId });

/// Dizer não a uma chamada de privado. Entrar e sair da sala não comunica
/// isso: pra quem chamou, recusar e ignorar ficariam idênticos.
export const recusarChamada = (channelId: string) => emit("voice:recusar", { channelId });

export const moveMember = (userId: string, channelId: string) =>
  emit("voice:moveMember", { userId, channelId });

export const playSound = (soundId: string) => emit("voice:sound", { soundId });
