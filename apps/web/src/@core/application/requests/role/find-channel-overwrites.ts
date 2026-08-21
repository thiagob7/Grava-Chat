import type { OverwriteModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export async function findChannelOverwrites(
  guildId: string,
  channelId: string,
): Promise<OverwriteModel[]> {
  const response = await api.get<OverwriteModel[]>(
    `/guilds/${guildId}/channels/${channelId}/permissions`,
  );
  return response.data;
}
