import { api } from "~/@core/lib/api";

export interface GuildPreviewModel {
  id: string;
  name: string;
  iconUrl: string | null;
  description: string | null;
  tag: string;
  tagIcon: string | null;
  memberCount: number;
  onlineCount: number;
  createdAt: string;
  souMembro: boolean;
}

/**
 * O cartão que abre ao clicar numa etiqueta de servidor.
 *
 * Só existe para servidor COM etiqueta: é a etiqueta que o anuncia, viajando ao
 * lado do nome de cada membro que a veste.
 */
export async function findGuildPreview(guildId: string): Promise<GuildPreviewModel> {
  const resposta = await api.get<GuildPreviewModel>(`/guilds/${guildId}/preview`);
  return resposta.data;
}
