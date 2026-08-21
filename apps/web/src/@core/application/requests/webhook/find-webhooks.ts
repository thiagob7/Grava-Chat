import type { WebhookModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export async function findWebhooks(guildId: string): Promise<WebhookModel[]> {
  const response = await api.get<WebhookModel[]>(`/guilds/${guildId}/webhooks`);
  return response.data;
}
