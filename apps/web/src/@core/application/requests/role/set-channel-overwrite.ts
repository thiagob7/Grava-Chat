import type { Permission } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export interface SetChannelOverwriteDTO {
  guildId: string;
  channelId: string;
  targetId: string;
  type: "ROLE" | "MEMBER";
  allow: Permission[];
  deny: Permission[];
}

export async function setChannelOverwrite({
  guildId,
  channelId,
  targetId,
  ...data
}: SetChannelOverwriteDTO): Promise<void> {
  await api.put(`/guilds/${guildId}/channels/${channelId}/permissions/${targetId}`, data);
}
