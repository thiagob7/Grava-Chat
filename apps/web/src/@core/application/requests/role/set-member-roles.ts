import type { GuildMember } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export interface SetMemberRolesDTO {
  guildId: string;
  userId: string;
  roleIds: string[];
}

export async function setMemberRoles({
  guildId,
  userId,
  roleIds,
}: SetMemberRolesDTO): Promise<GuildMember> {
  const response = await api.patch<GuildMember>(`/guilds/${guildId}/members/${userId}/roles`, {
    roleIds,
  });
  return response.data;
}
