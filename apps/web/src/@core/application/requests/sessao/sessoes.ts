import { api } from "~/@core/lib/api";

export interface SessaoModel {
  id: string;
  userAgent: string | null;
  ip: string | null;
  criadaEm: string;
  expiraEm: string;
  /// a deste aparelho — não dá pra encerrar por aqui
  atual: boolean;
}

export async function findSessoes(): Promise<SessaoModel[]> {
  const response = await api.get<SessaoModel[]>("/me/sessoes");
  return response.data;
}

export async function encerrarSessao(id: string): Promise<void> {
  await api.delete(`/me/sessoes/${id}`);
}
