import type { Message } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export async function findPins(channelId: string): Promise<Message[]> {
  const response = await api.get<Message[]>(`/channels/${channelId}/pins`);
  return response.data;
}

export async function pinMessage({ messageId, pin }: { messageId: string; pin: boolean }) {
  const response = pin
    ? await api.put<Message>(`/messages/${messageId}/pin`)
    : await api.delete<Message>(`/messages/${messageId}/pin`);

  return response.data;
}
