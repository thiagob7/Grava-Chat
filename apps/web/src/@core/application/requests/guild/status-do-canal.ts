import type { Channel } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export interface StatusDoCanalDTO {
  guildId: string;
  channelId: string;
  status: string | null;
}

export async function definirStatusDoCanal({ guildId, channelId, status }: StatusDoCanalDTO) {
  const response = await api.put<Channel>(
    `/guilds/${guildId}/channels/${channelId}/status`,
    { status },
  );

  return response.data;
}
