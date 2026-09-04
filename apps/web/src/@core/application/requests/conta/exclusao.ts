import { api } from "~/@core/lib/api";

export async function pedirExclusao(): Promise<{ excluirEm: string }> {
  const response = await api.post<{ excluirEm: string }>("/me/exclusao");
  return response.data;
}

export async function cancelarExclusao(): Promise<void> {
  await api.delete("/me/exclusao");
}
