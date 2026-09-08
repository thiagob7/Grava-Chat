import { api } from "~/@core/lib/api";
import { type MotivoDeDenuncia } from "~/@core/application/requests/guild/denunciar-guild";

export interface DenunciarMensagemDTO {
  messageId: string;
  motivo: MotivoDeDenuncia;
  detalhes?: string;
}

export async function denunciarMensagem({ messageId, ...dados }: DenunciarMensagemDTO): Promise<{ id: string }> {
  const response = await api.post<{ id: string }>(`/messages/${messageId}/denuncias`, dados);
  return response.data;
}
