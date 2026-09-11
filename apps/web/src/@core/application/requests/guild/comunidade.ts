import type { CommunitySettings, CommunityState } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export async function findCommunity(guildId: string): Promise<CommunityState> {
  const response = await api.get<CommunityState>(`/guilds/${guildId}/comunidade`);
  return response.data;
}

export interface CommunityEntry {
  verifiedRequiresEmail: boolean;
  filtersMediaExplicit: boolean;
  rulesChannelId: string | null;
  noticesChannelId: string | null;
  languagePrincipal: string | null;
}

export async function enableCommunity(
  guildId: string,
  data: CommunityEntry,
): Promise<CommunityState> {
  const response = await api.post<CommunityState>(`/guilds/${guildId}/comunidade`, data);
  return response.data;
}

export async function adjustCommunity(
  guildId: string,
  data: Partial<CommunitySettings>,
): Promise<CommunityState> {
  const response = await api.patch<CommunityState>(`/guilds/${guildId}/comunidade`, data);
  return response.data;
}
