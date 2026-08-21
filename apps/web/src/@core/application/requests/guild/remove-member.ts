import { api } from "~/@core/lib/api";

export async function removeMember({ guildId, userId }: { guildId: string; userId: string }) {
  await api.delete(`/guilds/${guildId}/members/${userId}`);
}
