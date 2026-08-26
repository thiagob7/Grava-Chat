import type { Message } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export async function findFavoriteMessages(): Promise<Message[]> {
  const response = await api.get<Message[]>("/messages/favoritas");
  return response.data;
}

export async function findFavoriteMessageIds(): Promise<string[]> {
  const response = await api.get<string[]>("/messages/favoritas/ids");
  return response.data;
}

export async function toggleFavoriteMessage(
  messageId: string,
  favoritar: boolean,
): Promise<string[]> {
  const response = favoritar
    ? await api.put<string[]>(`/messages/${messageId}/favorita`)
    : await api.delete<string[]>(`/messages/${messageId}/favorita`);

  return response.data;
}
