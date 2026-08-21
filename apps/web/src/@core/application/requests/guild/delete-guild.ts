import { api } from "~/@core/lib/api";

export async function deleteGuild(guildId: string): Promise<void> {
  await api.delete(`/guilds/${guildId}`);
}
