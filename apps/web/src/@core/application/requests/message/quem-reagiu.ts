import type { ReactionPeople } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export async function findWhoReacted(messageId: string): Promise<ReactionPeople[]> {
  const response = await api.get<ReactionPeople[]>(`/messages/${messageId}/reactions`);
  return response.data;
}
