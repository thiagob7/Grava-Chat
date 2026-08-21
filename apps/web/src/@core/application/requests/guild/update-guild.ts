import type { GuildModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export interface UpdateGuildDTO {
  guildId: string;
  name?: string;
  iconUrl?: string | null;
  description?: string | null;
  /** etiqueta ao lado do nome de quem é membro */
  tag?: string | null;
  tagIcon?: string | null;
  /** canal das mensagens do sistema (boas-vindas) */
  systemChannelId?: string | null;
  welcomeEnabled?: boolean;
}

export async function updateGuild({ guildId, ...data }: UpdateGuildDTO): Promise<GuildModel> {
  const response = await api.patch<GuildModel>(`/guilds/${guildId}`, data);
  return response.data;
}
