import { api } from "~/@core/lib/api";

export interface ChannelRead {
  channelId: string;
  messageId: string;
}

export async function markServerRead(guildId: string): Promise<ChannelRead[]> {
  const response = await api.post<ChannelRead[]>(`/guilds/${guildId}/lidas`);
  return response.data;
}
