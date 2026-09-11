import type { MessageModel } from "~/@core/domain/models/message-model";
import { api } from "~/@core/lib/api";

export interface MentionModel extends MessageModel {
  channel: { id: string; name: string; guildId: string | null };
}

export async function findMentions(): Promise<MentionModel[]> {
  const response = await api.get<MentionModel[]>("/me/mentions");
  return response.data;
}
