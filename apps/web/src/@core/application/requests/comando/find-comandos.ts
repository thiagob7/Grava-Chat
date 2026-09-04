import type { ComandoDisponivel } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export async function findComandos(guildId: string): Promise<ComandoDisponivel[]> {
  const response = await api.get<ComandoDisponivel[]>(`/guilds/${guildId}/comandos`);
  return response.data;
}
