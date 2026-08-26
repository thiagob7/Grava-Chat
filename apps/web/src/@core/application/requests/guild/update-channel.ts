import type { Channel, FonteDeNome } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export interface UpdateChannelDTO {
  guildId: string;
  channelId: string;
  name?: string;
  fonte?: FonteDeNome;
  topic?: string | null;
  slowmodeSeconds?: number;
  contentVisibility?: "DEFAULT" | "SPOILER" | "AGE_RESTRICTED";
  bitrate?: number;
  videoQuality?: "AUTO" | "HD";
  userLimit?: number;
}

export async function updateChannel({
  guildId,
  channelId,
  ...data
}: UpdateChannelDTO): Promise<Channel> {
  const response = await api.patch<Channel>(`/guilds/${guildId}/channels/${channelId}`, data);
  return response.data;
}

export async function deleteChannel({ guildId, channelId }: { guildId: string; channelId: string }) {
  await api.delete(`/guilds/${guildId}/channels/${channelId}`);
}
