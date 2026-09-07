import { api } from "~/@core/lib/api";

export interface CanalLido {
  channelId: string;
  messageId: string;
}

export async function marcarServidorLido(guildId: string): Promise<CanalLido[]> {
  const response = await api.post<CanalLido[]>(`/guilds/${guildId}/lidas`);
  return response.data;
}
