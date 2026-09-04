import type { MessageModel } from "~/@core/domain/models/message-model";
import { api } from "~/@core/lib/api";

export interface MencaoModel extends MessageModel {
  canal: { id: string; nome: string; guildId: string | null };
}

export async function findMentions(): Promise<MencaoModel[]> {
  const response = await api.get<MencaoModel[]>("/me/mentions");
  return response.data;
}
