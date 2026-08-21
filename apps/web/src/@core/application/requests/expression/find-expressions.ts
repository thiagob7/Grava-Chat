import type { PublicUser } from "@gravae/shared";
import type { GuildEmoji, GuildSound, Sticker } from "@gravae/shared";
import { api } from "~/@core/lib/api";

type ComAutor<T> = T & { createdBy: PublicUser | null };

export interface ExpressionsModel {
  emojis: ComAutor<GuildEmoji>[];
  stickers: ComAutor<Sticker>[];
  sounds: ComAutor<GuildSound>[];
}

export async function findExpressions(guildId: string): Promise<ExpressionsModel> {
  const response = await api.get<ExpressionsModel>(`/guilds/${guildId}/expressions`);
  return response.data;
}
