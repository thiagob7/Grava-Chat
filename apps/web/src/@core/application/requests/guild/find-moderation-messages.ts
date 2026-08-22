import { api } from "~/@core/lib/api";
import type { ModerationMessageModel } from "~/@core/domain/models/moderation-model";

export async function findModerationMessages(
  guildId: string,
  userId: string,
  filtro: "todas" | "links" | "midia",
): Promise<ModerationMessageModel[]> {
  const response = await api.get<ModerationMessageModel[]>(
    `/guilds/${guildId}/members/${userId}/messages`,
    { params: { filtro } },
  );

  return response.data;
}
