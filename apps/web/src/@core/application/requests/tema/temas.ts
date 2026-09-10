import type { AtivoDoTema, TemaCompartilhado } from "@gravae/shared";

import { api } from "~/@core/lib/api";

/*
  O corpo como ele PODE chegar, não como queremos que chegue.

  O web sobe sozinho quando um merge entra na master; a API sobe na mão, por
  script. Os dois nunca estão em passo, e na janela entre um e outro o web
  recebe o corpo antigo, sem os campos que acabou de aprender.

  Em 10/09/2026 isso derrubou o app inteiro: o cartão de tema lia
  `tema.ativos.length` e do outro lado o campo ainda não existia. Erro de tela
  branca, num cartão que aparece em canal.

  Campo novo entra por aqui com valor de reserva, nunca cru.
*/
export type TemaQueChegou = Omit<TemaCompartilhado, "ativos"> & { ativos?: AtivoDoTema[] };

export const normalizarTema = (tema: TemaQueChegou): TemaCompartilhado => ({
  ...tema,
  ativos: tema.ativos ?? [],
});

export interface PublicarTemaDTO {
  css: string;
  substituicoes: Record<string, string>;
  ativos: AtivoDoTema[];
  nome?: string;
}

export async function publicarTema(dados: PublicarTemaDTO): Promise<TemaCompartilhado> {
  const response = await api.post<TemaQueChegou>("/temas", dados);
  return normalizarTema(response.data);
}

export async function findTema(temaId: string): Promise<TemaCompartilhado> {
  const response = await api.get<TemaQueChegou>(`/temas/${temaId}`);
  return normalizarTema(response.data);
}

export async function findMeusTemas(): Promise<TemaCompartilhado[]> {
  const response = await api.get<TemaQueChegou[]>("/temas");
  return response.data.map(normalizarTema);
}

export async function apagarTema(temaId: string): Promise<void> {
  await api.delete(`/temas/${temaId}`);
}
