import type { Channel } from "@gravae/shared";
import type { CreateChannelDTO } from "~/@core/domain/dtos/guild-dto";
import { api } from "~/@core/lib/api";

export async function createChannel({ guildId, ...data }: CreateChannelDTO): Promise<Channel> {
  const response = await api.post<Channel>(`/guilds/${guildId}/channels`, data);
  return response.data;
}
