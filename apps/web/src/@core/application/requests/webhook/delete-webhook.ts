import { api } from "~/@core/lib/api";

export interface DeleteWebhookDTO {
  guildId: string;
  webhookId: string;
}

export async function deleteWebhook({ guildId, webhookId }: DeleteWebhookDTO): Promise<void> {
  await api.delete(`/guilds/${guildId}/webhooks/${webhookId}`);
}
