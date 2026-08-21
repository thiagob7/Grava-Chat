import type { Permission } from "@gravae/shared";
import type { RoleModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export interface CreateRoleDTO {
  guildId: string;
  name: string;
  color?: string | null;
  permissions?: Permission[];
  hoist?: boolean;
  mentionable?: boolean;
}

export async function createRole({ guildId, ...data }: CreateRoleDTO): Promise<RoleModel> {
  const response = await api.post<RoleModel>(`/guilds/${guildId}/roles`, data);
  return response.data;
}
