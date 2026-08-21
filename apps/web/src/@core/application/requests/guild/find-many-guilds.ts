import type { GuildSummaryModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export async function findManyGuilds(): Promise<GuildSummaryModel[]> {
  const response = await api.get<GuildSummaryModel[]>("/guilds");
  return response.data;
}
