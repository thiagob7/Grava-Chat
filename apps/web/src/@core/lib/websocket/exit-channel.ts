import { emit } from ".";

export const exitChannel = (channelId: string) => emit("channel:unsubscribe", { channelId });
