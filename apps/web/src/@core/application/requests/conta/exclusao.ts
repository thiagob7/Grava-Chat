import { api } from "~/@core/lib/api";

export async function requestDeletion(): Promise<{ deleteAt: string }> {
  const response = await api.post<{ deleteAt: string }>("/me/exclusao");
  return response.data;
}

export async function cancelDeletion(): Promise<void> {
  await api.delete("/me/exclusao");
}
