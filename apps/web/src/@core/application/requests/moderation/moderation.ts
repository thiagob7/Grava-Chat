import type { GuildMember, PublicUser } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export interface BanModel {
  user: PublicUser;
  moderator: PublicUser | null;
  reason: string | null;
  createdAt: string;
}

export interface AuditEntryModel {
  id: string;
  actor: PublicUser;
  action: string;
  targetType: string;
  targetId: string | null;
  targetName: string | null;
  changes: Record<string, { de: unknown; para: unknown }> | null;
  reason: string | null;
  createdAt: string;
}

export interface AutoModRuleModel {
  id: string;
  guildId: string;
  name: string;
  enabled: boolean;
  trigger: "WORDS" | "MENTION_SPAM" | "LINKS";
  palavras: string[];
  limiteMencoes: number | null;
  acoes: ("BLOCK" | "ALERT" | "TIMEOUT")[];
  alertChannelId: string | null;
  timeoutSeconds: number | null;
  cargosIsentos: string[];
}

export async function findBans(guildId: string): Promise<BanModel[]> {
  const response = await api.get<BanModel[]>(`/guilds/${guildId}/bans`);
  return response.data;
}

export async function banMember({
  guildId,
  userId,
  ...body
}: {
  guildId: string;
  userId: string;
  reason?: string | null;
  apagarHoras?: number;
}) {
  await api.put(`/guilds/${guildId}/bans/${userId}`, body);
}

export async function unbanMember({ guildId, userId }: { guildId: string; userId: string }) {
  await api.delete(`/guilds/${guildId}/bans/${userId}`);
}

export async function timeoutMember({
  guildId,
  userId,
  ...body
}: {
  guildId: string;
  userId: string;
  minutos: number;
  reason?: string | null;
}): Promise<GuildMember> {
  const response = await api.put<GuildMember>(`/guilds/${guildId}/members/${userId}/timeout`, body);
  return response.data;
}

export async function setNickname({
  guildId,
  userId,
  nickname,
}: {
  guildId: string;
  userId: string;
  nickname: string | null;
}): Promise<GuildMember> {
  const response = await api.patch<GuildMember>(`/guilds/${guildId}/members/${userId}/nickname`, {
    nickname,
  });
  return response.data;
}

export async function findAuditLog(
  guildId: string,
  params: { actorId?: string; action?: string },
): Promise<{ entries: AuditEntryModel[]; hasMore: boolean }> {
  const response = await api.get<{ entries: AuditEntryModel[]; hasMore: boolean }>(
    `/guilds/${guildId}/audit-log`,
    { params },
  );
  return response.data;
}

export async function findAutoModRules(guildId: string): Promise<AutoModRuleModel[]> {
  const response = await api.get<AutoModRuleModel[]>(`/guilds/${guildId}/automod`);
  return response.data;
}

export type SaveAutoModDTO = Omit<AutoModRuleModel, "id" | "guildId"> & {
  guildId: string;
  ruleId?: string;
};

export async function saveAutoModRule({ guildId, ruleId, ...data }: SaveAutoModDTO) {
  const response = ruleId
    ? await api.patch<AutoModRuleModel>(`/guilds/${guildId}/automod/${ruleId}`, data)
    : await api.post<AutoModRuleModel>(`/guilds/${guildId}/automod`, data);

  return response.data;
}

export async function deleteAutoModRule({ guildId, ruleId }: { guildId: string; ruleId: string }) {
  await api.delete(`/guilds/${guildId}/automod/${ruleId}`);
}
