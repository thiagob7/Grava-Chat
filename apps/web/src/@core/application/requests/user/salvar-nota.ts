import { api } from "~/@core/lib/api";

/** Texto vazio apaga a nota — é assim que se remove uma. */
export async function salvarNota(userId: string, texto: string): Promise<{ nota: string | null }> {
  const resposta = await api.put<{ nota: string | null }>(`/users/${userId}/nota`, { texto });
  return resposta.data;
}
