import type { GuildDetailModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export async function findGuild(guildId: string): Promise<GuildDetailModel> {
  const response = await api.get<GuildDetailModel>(`/guilds/${guildId}`);
  return response.data;
}
