
export interface CallReceived {
  guildId: string | null;
  channelId: string;
  whoJoined: string;
  euAm: string;
  voiceMyChannel: string | null;
}

export function mustPlay({
  guildId,
  channelId,
  whoJoined,
  euAm,
  voiceMyChannel,
}: CallReceived): boolean {
  if (guildId !== null) return false;

  if (whoJoined === euAm) return false;

  if (voiceMyChannel === channelId) return false;

  return true;
}

export function thisCalling({
  guildId,
  countRoom,
}: {
  guildId: string | null;
  countRoom: number;
}): boolean {
  return guildId === null && countRoom <= 1;
}
