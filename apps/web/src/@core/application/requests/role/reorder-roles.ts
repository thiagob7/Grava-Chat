import type { RoleModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export interface ReorderRolesDTO {
  guildId: string;
  /** a ordem inteira; posição 0 é do @everyone e não entra aqui */
  roles: { id: string; position: number }[];
}

export async function reorderRoles({ guildId, roles }: ReorderRolesDTO): Promise<RoleModel[]> {
  const response = await api.patch<RoleModel[]>(`/guilds/${guildId}/roles`, { roles });
  return response.data;
}
