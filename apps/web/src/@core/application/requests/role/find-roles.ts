import type { RoleModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export async function findRoles(guildId: string): Promise<RoleModel[]> {
  const response = await api.get<RoleModel[]>(`/guilds/${guildId}/roles`);
  return response.data;
}
