import { api } from "~/@core/lib/api";

export interface DeleteRoleDTO {
  guildId: string;
  roleId: string;
}

export async function deleteRole({ guildId, roleId }: DeleteRoleDTO): Promise<void> {
  await api.delete(`/guilds/${guildId}/roles/${roleId}`);
}
