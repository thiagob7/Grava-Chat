import type { WebhookModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export interface UpdateWebhookDTO {
  guildId: string;
  webhookId: string;
  name?: string;
  channelId?: string;
  avatarUrl?: string | null;
}

export async function updateWebhook({
  guildId,
  webhookId,
  ...data
}: UpdateWebhookDTO): Promise<WebhookModel> {
  const response = await api.patch<WebhookModel>(`/guilds/${guildId}/webhooks/${webhookId}`, data);
  return response.data;
}
