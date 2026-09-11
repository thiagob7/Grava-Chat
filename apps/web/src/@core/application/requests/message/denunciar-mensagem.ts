import { api } from "~/@core/lib/api";
import { type ReportReason } from "~/@core/application/requests/guild/denunciar-guild";

export interface ReportMessageDto {
  messageId: string;
  reason: ReportReason;
  details?: string;
}

export async function reportMessage({ messageId, ...data }: ReportMessageDto): Promise<{ id: string }> {
  const response = await api.post<{ id: string }>(`/messages/${messageId}/denuncias`, data);
  return response.data;
}
