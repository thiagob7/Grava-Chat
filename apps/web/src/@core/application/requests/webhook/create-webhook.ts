import type { WebhookModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export interface CreateWebhookDTO {
  guildId: string;
  name: string;
  channelId: string;
}

export async function createWebhook({ guildId, ...data }: CreateWebhookDTO): Promise<WebhookModel> {
  const response = await api.post<WebhookModel>(`/guilds/${guildId}/webhooks`, data);
  return response.data;
}
