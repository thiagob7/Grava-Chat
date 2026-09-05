import type { CategoriaDeComunidade } from "@gravae/shared";

import type { GuildModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export interface UpdateGuildDTO {
  guildId: string;
  name?: string;
  iconUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  tag?: string | null;
  tagIcon?: string | null;
  systemChannelId?: string | null;
  welcomeEnabled?: boolean;
  welcomeMessage?: string | null;
  categoria?: CategoriaDeComunidade | null;
  descobrivel?: boolean;
}

export async function updateGuild({ guildId, ...data }: UpdateGuildDTO): Promise<GuildModel> {
  const response = await api.patch<GuildModel>(`/guilds/${guildId}`, data);
  return response.data;
}
