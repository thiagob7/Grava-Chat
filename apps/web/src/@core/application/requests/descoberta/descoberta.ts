import {
  pesoDoTema,
  type AplicativoDescoberto,
  type AtivoDoTema,
  type ComunidadeDescoberta,
  type TemaDaGaleria,
} from "@gravae/shared";

import { api } from "~/@core/lib/api";

/*
  Mesma prevenção do módulo de temas: a API pode ser mais velha que a tela.
  Sem o peso, `pesoLegivel` escrevia "NaN MB" no cartão; sem os ativos, a
  galeria quebrava na primeira leitura de `.length`.
*/
export type TemaDaGaleriaQueChegou = Omit<TemaDaGaleria, "ativos" | "pesoEmBytes"> & {
  ativos?: AtivoDoTema[];
  pesoEmBytes?: number;
};

export const normalizarTemaDaGaleria = (tema: TemaDaGaleriaQueChegou): TemaDaGaleria => {
  const ativos = tema.ativos ?? [];

  return { ...tema, ativos, pesoEmBytes: tema.pesoEmBytes ?? pesoDoTema("", ativos) };
};

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
  const response = await api.get<TemaDaGaleriaQueChegou[]>("/descobrir/temas", {
    params: { busca },
  });
  return response.data.map(normalizarTemaDaGaleria);
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
