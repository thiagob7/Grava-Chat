import { api } from "~/@core/lib/api";

import type { PublicUserModel } from "~/@core/domain/models/user-model";

export interface AplicativoAutorizadoModel {
  id: string;
  usuario: PublicUserModel;
  descricao: string | null;
  escopos: string[];
  autorizadoEm: string | null;
  expiraEm: string | null;
}

export async function findAplicativosAutorizados(): Promise<AplicativoAutorizadoModel[]> {
  const response = await api.get<AplicativoAutorizadoModel[]>("/me/aplicativos");
  return response.data;
}

export async function revogarAplicativo(botId: string): Promise<void> {
  await api.delete(`/me/aplicativos/${botId}`);
}
