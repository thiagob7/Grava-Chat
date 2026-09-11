import { api } from "~/@core/lib/api";

export const REPORT_REASONS = ["spam", "assedio", "conteudo", "golpe", "outro"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export interface ReportGuildDto {
  guildId: string;
  reason: ReportReason;
  details?: string;
}

export async function reportGuild({ guildId, ...data }: ReportGuildDto): Promise<{ id: string }> {
  const response = await api.post<{ id: string }>(`/guilds/${guildId}/denuncias`, data);
  return response.data;
}
