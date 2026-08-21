import type { CreateInviteDTO } from "~/@core/domain/dtos/guild-dto";
import type { InviteModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export async function createInvite({ guildId, ...data }: CreateInviteDTO): Promise<InviteModel> {
  const response = await api.post<InviteModel>(`/guilds/${guildId}/invites`, data);
  return response.data;
}
