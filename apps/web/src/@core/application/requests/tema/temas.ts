import type { TemaCompartilhado } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export interface PublicarTemaDTO {
  css: string;
  substituicoes: Record<string, string>;
  nome?: string;
}

export async function publicarTema(dados: PublicarTemaDTO): Promise<TemaCompartilhado> {
  const response = await api.post<TemaCompartilhado>("/temas", dados);
  return response.data;
}

export async function findTema(temaId: string): Promise<TemaCompartilhado> {
  const response = await api.get<TemaCompartilhado>(`/temas/${temaId}`);
  return response.data;
}

export async function findMeusTemas(): Promise<TemaCompartilhado[]> {
  const response = await api.get<TemaCompartilhado[]>("/temas");
  return response.data;
}

export async function apagarTema(temaId: string): Promise<void> {
  await api.delete(`/temas/${temaId}`);
}
