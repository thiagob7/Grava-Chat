import { api } from "~/@core/lib/api";
import type { ModerationMessageModel } from "~/@core/domain/models/moderation-model";

export async function findModerationMessages(
  guildId: string,
  userId: string,
  filter: "todas" | "links" | "midia",
): Promise<ModerationMessageModel[]> {
  const response = await api.get<ModerationMessageModel[]>(
    `/guilds/${guildId}/members/${userId}/messages`,
    { params: { filter } },
  );

  return response.data;
}
