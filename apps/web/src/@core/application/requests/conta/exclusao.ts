import { api } from "~/@core/lib/api";

/// Marca a conta para exclusão e derruba as sessões. Nada é apagado agora — a
/// resposta traz a data em que isso vai acontecer.
export async function pedirExclusao(): Promise<{ excluirEm: string }> {
  const response = await api.post<{ excluirEm: string }>("/me/exclusao");
  return response.data;
}

/// Desmarca. Como nada foi apagado, voltar é só limpar a data.
export async function cancelarExclusao(): Promise<void> {
  await api.delete("/me/exclusao");
}
