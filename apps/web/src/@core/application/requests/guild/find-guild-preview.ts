import { api } from "~/@core/lib/api";

export interface GuildPreviewModel {
  id: string;
  name: string;
  iconUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  tag: string;
  tagIcon: string | null;
  memberCount: number;
  onlineCount: number;
  createdAt: string;
  souMembro: boolean;
}

export async function findGuildPreview(guildId: string): Promise<GuildPreviewModel> {
  const resposta = await api.get<GuildPreviewModel>(`/guilds/${guildId}/preview`);
  return resposta.data;
}
