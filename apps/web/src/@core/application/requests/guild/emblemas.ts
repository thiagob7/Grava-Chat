import type { Emblema } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export async function criarEmblema(
  guildId: string,
  data: { nome: string; emoji?: string | null; iconUrl?: string | null },
): Promise<Emblema> {
  const resposta = await api.post<Emblema>(`/guilds/${guildId}/emblemas`, data);
  return resposta.data;
}

export async function removerEmblema(guildId: string, emblemaId: string): Promise<void> {
  await api.delete(`/guilds/${guildId}/emblemas/${emblemaId}`);
}

export async function vestirEmblemas(
  guildId: string,
  emblemIds: string[],
): Promise<{ emblemIds: string[] }> {
  const resposta = await api.put<{ emblemIds: string[] }>(
    `/guilds/${guildId}/members/@me/emblemas`,
    { emblemIds },
  );

  return resposta.data;
}
