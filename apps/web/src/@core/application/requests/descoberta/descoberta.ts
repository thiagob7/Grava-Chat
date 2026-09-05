import type { ComunidadeDescoberta } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export interface FiltroDeDescoberta {
  categoria?: string;
  busca?: string;
}

export async function findComunidades(
  filtro: FiltroDeDescoberta,
): Promise<ComunidadeDescoberta[]> {
  const response = await api.get<ComunidadeDescoberta[]>("/descobrir", { params: filtro });
  return response.data;
}

export async function entrarNaComunidade(
  guildId: string,
): Promise<{ guildId: string; jaEraMembro: boolean }> {
  const response = await api.post<{ guildId: string; jaEraMembro: boolean }>(
    `/descobrir/${guildId}/entrar`,
  );
  return response.data;
}
