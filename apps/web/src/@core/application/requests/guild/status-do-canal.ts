import type { Channel } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export interface ChannelDtoStatus {
  guildId: string;
  channelId: string;
  status: string | null;
}

export async function setChannelStatus({ guildId, channelId, status }: ChannelDtoStatus) {
  const response = await api.put<Channel>(
    `/guilds/${guildId}/channels/${channelId}/status`,
    { status },
  );

  return response.data;
}
