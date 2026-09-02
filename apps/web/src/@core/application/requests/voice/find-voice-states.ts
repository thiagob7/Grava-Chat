import type { VozNoServidor } from "@gravae/shared";

import { api } from "~/@core/lib/api";

/// Quem está em voz em todos os meus servidores, por servidor. Só canal com
/// gente vem — canal vazio não interessa a quem está olhando o trilho.
export async function findVoiceStates(): Promise<Record<string, VozNoServidor[]>> {
  const response = await api.get<Record<string, VozNoServidor[]>>("/me/voice-states");
  return response.data;
}
