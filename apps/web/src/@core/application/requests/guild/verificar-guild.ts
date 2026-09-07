import { api } from "~/@core/lib/api";

export interface VerificarGuildDTO {
  guildId: string;
  verificada: boolean;
}

export async function verificarGuild({ guildId, verificada }: VerificarGuildDTO) {
  const response = await api.put<{ id: string; verificada: boolean }>(`/guilds/${guildId}/verificacao`, { verificada });
  return response.data;
}
