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
  amMember: boolean;
}

export async function findGuildPreview(guildId: string): Promise<GuildPreviewModel> {
  const reply = await api.get<GuildPreviewModel>(`/guilds/${guildId}/preview`);
  return reply.data;
}
