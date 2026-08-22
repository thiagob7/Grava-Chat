import { api } from "~/@core/lib/api";
import type { ModerationViewModel } from "~/@core/domain/models/moderation-model";

export async function findModerationView(
  guildId: string,
  userId: string,
): Promise<ModerationViewModel> {
  const response = await api.get<ModerationViewModel>(
    `/guilds/${guildId}/members/${userId}/moderation`,
  );

  return response.data;
}
