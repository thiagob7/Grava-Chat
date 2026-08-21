import type { GuildInviteModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export async function findGuildInvites(guildId: string): Promise<GuildInviteModel[]> {
  const response = await api.get<GuildInviteModel[]>(`/guilds/${guildId}/invites`);
  return response.data;
}
