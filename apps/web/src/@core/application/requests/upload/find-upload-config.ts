import { api } from "~/@core/lib/api";

export async function findUploadConfig(): Promise<{ direct: boolean }> {
  const response = await api.get<{ direct: boolean }>("/uploads/config");
  return response.data;
}
