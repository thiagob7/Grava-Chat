import type { AvailableCommand } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export async function findCommands(guildId: string): Promise<AvailableCommand[]> {
  const response = await api.get<AvailableCommand[]>(`/guilds/${guildId}/comandos`);
  return response.data;
}
