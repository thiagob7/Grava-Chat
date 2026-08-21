import type { CreateGuildDTO } from "~/@core/domain/dtos/guild-dto";
import type { GuildSummaryModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export async function createGuild(data: CreateGuildDTO): Promise<GuildSummaryModel> {
  const response = await api.post<GuildSummaryModel>("/guilds", data);
  return response.data;
}
