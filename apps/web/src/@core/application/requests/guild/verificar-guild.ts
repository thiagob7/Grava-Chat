import { api } from "~/@core/lib/api";

export interface VerifyGuildDto {
  guildId: string;
  verified: boolean;
}

export async function verifyGuild({ guildId, verified }: VerifyGuildDto) {
  const response = await api.put<{ id: string; verified: boolean }>(`/guilds/${guildId}/verificacao`, { verified });
  return response.data;
}
