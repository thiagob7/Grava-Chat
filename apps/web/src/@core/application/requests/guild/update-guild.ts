import type { GuildModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export interface UpdateGuildDTO {
  guildId: string;
  name?: string;
  iconUrl?: string | null;
  description?: string | null;
  tag?: string | null;
  tagIcon?: string | null;
  systemChannelId?: string | null;
  welcomeEnabled?: boolean;
  welcomeMessage?: string | null;
}

export async function updateGuild({ guildId, ...data }: UpdateGuildDTO): Promise<GuildModel> {
  const response = await api.patch<GuildModel>(`/guilds/${guildId}`, data);
  return response.data;
}
