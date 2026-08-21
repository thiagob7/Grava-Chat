import type { FindMessagesDTO } from "~/@core/domain/dtos/message-dto";
import type { MessagePageModel } from "~/@core/domain/models/message-model";
import { api } from "~/@core/lib/api";

export async function findMessages({
  channelId,
  before,
  postId,
}: FindMessagesDTO): Promise<MessagePageModel> {
  const response = await api.get<MessagePageModel>(`/channels/${channelId}/messages`, {
    params: { ...(before ? { before } : {}), ...(postId ? { postId } : {}) },
  });

  return response.data;
}
