import type { ComandoDisponivel } from "@gravae/shared";

import { api } from "~/@core/lib/api";

/// Tudo o que dá para digitar depois da barra neste servidor — de todos os
/// bots que estão lá dentro, cada um com o seu.
export async function findComandos(guildId: string): Promise<ComandoDisponivel[]> {
  const response = await api.get<ComandoDisponivel[]>(`/guilds/${guildId}/comandos`);
  return response.data;
}
