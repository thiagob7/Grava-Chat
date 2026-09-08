import { api } from "~/@core/lib/api";

export interface CreateCategoryDTO {
  guildId: string;
  name: string;
}

export async function createCategory({ guildId, name }: CreateCategoryDTO) {
  const response = await api.post<{ id: string; name: string }>(`/guilds/${guildId}/categories`, { name });
  return response.data;
}
