import type { Badge } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export async function createBadge(
  guildId: string,
  data: { name: string; emoji?: string | null; iconUrl?: string | null },
): Promise<Badge> {
  const reply = await api.post<Badge>(`/guilds/${guildId}/emblemas`, data);
  return reply.data;
}

export async function removeBadge(guildId: string, badgeId: string): Promise<void> {
  await api.delete(`/guilds/${guildId}/emblemas/${badgeId}`);
}

export async function wearBadges(
  guildId: string,
  emblemIds: string[],
): Promise<{ emblemIds: string[] }> {
  const reply = await api.put<{ emblemIds: string[] }>(
    `/guilds/${guildId}/members/@me/emblemas`,
    { emblemIds },
  );

  return reply.data;
}
