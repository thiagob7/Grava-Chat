import { api } from "~/@core/lib/api";

export type RequestAction = "aceitar" | "ignorar" | "spam";

export async function dmReplyRequest(channelId: string, action: RequestAction) {
  const response = await api.post<{ accepted: boolean }>(`/dms/pedidos/${channelId}`, { action });
  return response.data;
}
