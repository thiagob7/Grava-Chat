import { api } from "~/@core/lib/api";

export async function deleteInvite({ guildId, inviteId }: { guildId: string; inviteId: string }) {
  await api.delete(`/guilds/${guildId}/invites/${inviteId}`);
}
