import type { VozNoServidor } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export async function findVoiceStates(): Promise<Record<string, VozNoServidor[]>> {
  const response = await api.get<Record<string, VozNoServidor[]>>("/me/voice-states");
  return response.data;
}
