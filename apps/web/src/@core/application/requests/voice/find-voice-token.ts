import type { VoiceTokenModel } from "~/@core/domain/models/voice-model";
import { api } from "~/@core/lib/api";

export async function findVoiceToken(channelId: string): Promise<VoiceTokenModel> {
  const response = await api.post<VoiceTokenModel>(`/channels/${channelId}/voice-token`);
  return response.data;
}
