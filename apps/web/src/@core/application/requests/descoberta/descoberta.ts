import type { AplicativoDescoberto, ComunidadeDescoberta, TemaDaGaleria } from "@gravae/shared";

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

export async function findTemasDaGaleria(busca?: string): Promise<TemaDaGaleria[]> {
  const response = await api.get<TemaDaGaleria[]>("/descobrir/temas", { params: { busca } });
  return response.data;
}

export async function findAplicativos(busca?: string): Promise<AplicativoDescoberto[]> {
  const response = await api.get<AplicativoDescoberto[]>("/descobrir/aplicativos", {
    params: { busca },
  });
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
