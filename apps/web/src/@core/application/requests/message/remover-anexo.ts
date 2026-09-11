import { api } from "~/@core/lib/api";

export async function removeAttachment(messageId: string, attachmentId: string): Promise<void> {
  await api.delete(`/messages/${messageId}/anexos/${attachmentId}`);
}
