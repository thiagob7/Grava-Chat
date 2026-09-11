import type { VoiceServer } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export async function findVoiceStates(): Promise<Record<string, VoiceServer[]>> {
  const response = await api.get<Record<string, VoiceServer[]>>("/me/voice-states");
  return response.data;
}
