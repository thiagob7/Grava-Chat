import { api } from "~/@core/lib/api";

export type AcaoDoPedido = "aceitar" | "ignorar" | "spam";

export async function responderPedidoDeDm(channelId: string, acao: AcaoDoPedido) {
  const response = await api.post<{ aceito: boolean }>(`/dms/pedidos/${channelId}`, { acao });
  return response.data;
}
