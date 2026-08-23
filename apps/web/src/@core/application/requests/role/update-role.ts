import type { EstiloDeCargo, Permission } from "@gravae/shared";
import type { RoleModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export interface UpdateRoleDTO {
  guildId: string;
  roleId: string;
  name?: string;
  color?: string | null;
  /** segunda cor; só o gradiente usa */
  colorSecondary?: string | null;
  estilo?: EstiloDeCargo;
  /** emoji OU imagem — quem garante isso é o service */
  iconEmoji?: string | null;
  iconUrl?: string | null;
  permissions?: Permission[];
  hoist?: boolean;
  mentionable?: boolean;
}

export async function updateRole({ guildId, roleId, ...data }: UpdateRoleDTO): Promise<RoleModel> {
  const response = await api.patch<RoleModel>(`/guilds/${guildId}/roles/${roleId}`, data);
  return response.data;
}
