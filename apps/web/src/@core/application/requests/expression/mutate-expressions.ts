import type { GuildEmoji, GuildSound, Sticker } from "@gravae/shared";
import { api } from "~/@core/lib/api";

/** As três expressões seguem o mesmo formato de chamada; só muda o caminho. */
export interface CreateEmojiDTO {
  guildId: string;
  name: string;
  url: string;
  animated?: boolean;
}

export async function createEmoji({ guildId, ...data }: CreateEmojiDTO): Promise<GuildEmoji> {
  const response = await api.post<GuildEmoji>(`/guilds/${guildId}/emojis`, data);
  return response.data;
}

export async function deleteEmoji({ guildId, emojiId }: { guildId: string; emojiId: string }) {
  await api.delete(`/guilds/${guildId}/emojis/${emojiId}`);
}

export interface CreateStickerDTO {
  guildId: string;
  name: string;
  description?: string | null;
  relatedEmoji: string;
  url: string;
  size: number;
}

export async function createSticker({ guildId, ...data }: CreateStickerDTO): Promise<Sticker> {
  const response = await api.post<Sticker>(`/guilds/${guildId}/stickers`, data);
  return response.data;
}

export async function deleteSticker({ guildId, stickerId }: { guildId: string; stickerId: string }) {
  await api.delete(`/guilds/${guildId}/stickers/${stickerId}`);
}

export interface CreateSoundDTO {
  guildId: string;
  name: string;
  emoji?: string | null;
  url: string;
  volume?: number;
  size: number;
}

export async function createSound({ guildId, ...data }: CreateSoundDTO): Promise<GuildSound> {
  const response = await api.post<GuildSound>(`/guilds/${guildId}/sounds`, data);
  return response.data;
}

export async function deleteSound({ guildId, soundId }: { guildId: string; soundId: string }) {
  await api.delete(`/guilds/${guildId}/sounds/${soundId}`);
}
