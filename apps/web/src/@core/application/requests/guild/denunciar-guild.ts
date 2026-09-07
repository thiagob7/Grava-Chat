import { api } from "~/@core/lib/api";

export const MOTIVOS_DE_DENUNCIA = ["spam", "assedio", "conteudo", "golpe", "outro"] as const;
export type MotivoDeDenuncia = (typeof MOTIVOS_DE_DENUNCIA)[number];

export interface DenunciarGuildDTO {
  guildId: string;
  motivo: MotivoDeDenuncia;
  detalhes?: string;
}

export async function denunciarGuild({ guildId, ...dados }: DenunciarGuildDTO): Promise<{ id: string }> {
  const response = await api.post<{ id: string }>(`/guilds/${guildId}/denuncias`, dados);
  return response.data;
}
