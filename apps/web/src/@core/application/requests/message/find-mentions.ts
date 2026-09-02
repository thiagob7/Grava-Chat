import type { MessageModel } from "~/@core/domain/models/message-model";
import { api } from "~/@core/lib/api";

/// A menção vem com o canal em que aconteceu: a caixa de entrada mostra as
/// menções de todos os servidores juntas, e sem isso não dá pra dizer de onde
/// cada uma veio nem pra onde levar quem clicar.
export interface MencaoModel extends MessageModel {
  canal: { id: string; nome: string; guildId: string | null };
}

export async function findMentions(): Promise<MencaoModel[]> {
  const response = await api.get<MencaoModel[]>("/me/mentions");
  return response.data;
}
