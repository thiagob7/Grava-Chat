import type { GuildMember } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export interface GuildProfileDto {
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
}

export const updateGuildProfile = async (guildId: string, data: GuildProfileDto) =>
  (await api.patch<GuildMember>(`/guilds/${guildId}/members/@me/profile`, data)).data;
