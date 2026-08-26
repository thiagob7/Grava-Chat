import { emit } from ".";

export const joinChannel = (channelId: string) => emit("channel:subscribe", { channelId });
