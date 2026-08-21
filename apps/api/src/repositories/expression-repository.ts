import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

/**
 * Emoji, figurinha e efeito sonoro do servidor. Três tabelas com a mesma
 * cara — ficam juntas porque a tela também as trata como uma coisa só
 * ("Expressões") e a permissão é a mesma.
 */
export const expressionRepository = {
  // ------------------------------------------------------------------ emoji
  findEmojisByGuild(guildId: string) {
    return prisma.guildEmoji.findMany({ where: { guildId }, orderBy: { createdAt: "asc" } });
  },

  findEmojiById(id: string) {
    return prisma.guildEmoji.findUnique({ where: { id } });
  },

  findEmojiByName(guildId: string, name: string) {
    return prisma.guildEmoji.findUnique({ where: { guildId_name: { guildId, name } } });
  },

  countEmojis(guildId: string) {
    return prisma.guildEmoji.count({ where: { guildId } });
  },

  createEmoji(data: Prisma.GuildEmojiUncheckedCreateInput) {
    return prisma.guildEmoji.create({ data });
  },

  updateEmoji(id: string, data: Prisma.GuildEmojiUpdateInput) {
    return prisma.guildEmoji.update({ where: { id }, data });
  },

  removeEmoji(id: string) {
    return prisma.guildEmoji.delete({ where: { id } });
  },

  // -------------------------------------------------------------- figurinha
  findStickersByGuild(guildId: string) {
    return prisma.guildSticker.findMany({ where: { guildId }, orderBy: { createdAt: "asc" } });
  },

  findStickerById(id: string) {
    return prisma.guildSticker.findUnique({ where: { id } });
  },

  countStickers(guildId: string) {
    return prisma.guildSticker.count({ where: { guildId } });
  },

  createSticker(data: Prisma.GuildStickerUncheckedCreateInput) {
    return prisma.guildSticker.create({ data });
  },

  updateSticker(id: string, data: Prisma.GuildStickerUpdateInput) {
    return prisma.guildSticker.update({ where: { id }, data });
  },

  removeSticker(id: string) {
    return prisma.guildSticker.delete({ where: { id } });
  },

  // ------------------------------------------------------------------- som
  findSoundsByGuild(guildId: string) {
    return prisma.guildSound.findMany({ where: { guildId }, orderBy: { createdAt: "asc" } });
  },

  findSoundById(id: string) {
    return prisma.guildSound.findUnique({ where: { id } });
  },

  countSounds(guildId: string) {
    return prisma.guildSound.count({ where: { guildId } });
  },

  createSound(data: Prisma.GuildSoundUncheckedCreateInput) {
    return prisma.guildSound.create({ data });
  },

  updateSound(id: string, data: Prisma.GuildSoundUpdateInput) {
    return prisma.guildSound.update({ where: { id }, data });
  },

  removeSound(id: string) {
    return prisma.guildSound.delete({ where: { id } });
  },
};
