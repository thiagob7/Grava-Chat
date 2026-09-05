import { api } from "~/@core/lib/api";

export async function removerAnexo(messageId: string, anexoId: string): Promise<void> {
  await api.delete(`/messages/${messageId}/anexos/${anexoId}`);
}
