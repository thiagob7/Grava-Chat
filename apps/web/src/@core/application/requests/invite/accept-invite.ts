import { api } from "~/@core/lib/api";

export async function acceptInvite(code: string): Promise<{ guildId: string; alreadyMember: boolean }> {
  const response = await api.post<{ guildId: string; alreadyMember: boolean }>(`/invites/${code}/join`);
  return response.data;
}
