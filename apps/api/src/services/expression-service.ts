import { has, LIMITS } from "@gravae/shared";
import { AppError, ForbiddenError, NotFoundError } from "~/lib/http.js";
import { toGuildEmoji, toGuildSound, toPublicUser, toSticker } from "~/lib/serialize.js";
import { expressionRepository } from "~/repositories/expression-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "./access-service.js";
import { auditService } from "./audit-service.js";
import type {
  CreateEmojiInput,
  CreateSoundInput,
  CreateStickerInput,
} from "~/validations/expression.js";

export const expressionService = {
  async list(userId: string, guildId: string) {
    await accessService.requireMember(userId, guildId);

    const [emojis, stickers, sounds] = await Promise.all([
      expressionRepository.findEmojisByGuild(guildId),
      expressionRepository.findStickersByGuild(guildId),
      expressionRepository.findSoundsByGuild(guildId),
    ]);

    const authors = await userRepository.findManyByIds([
      ...new Set([...emojis, ...stickers, ...sounds].map((e) => e.createdById)),
    ]);
    const byId = new Map(authors.map((u) => [u.id, toPublicUser(u)]));

    return {
      emojis: emojis.map((e) => ({ ...toGuildEmoji(e), createdBy: byId.get(e.createdById) ?? null })),
      stickers: stickers.map((s) => ({ ...toSticker(s), createdBy: byId.get(s.createdById) ?? null })),
      sounds: sounds.map((s) => ({ ...toGuildSound(s), createdBy: byId.get(s.createdById) ?? null })),
    };
  },

  async createEmoji(userId: string, guildId: string, input: CreateEmojiInput) {
    await requireCanCreateExpression(userId, guildId);

    if ((await expressionRepository.countEmojis(guildId)) >= LIMITS.emojisByServer) {
      throw new AppError(`O servidor já tem ${LIMITS.emojisByServer} emojis`);
    }

    if (await expressionRepository.findEmojiByName(guildId, input.name)) {
      throw new AppError(`Já existe um emoji chamado :${input.name}:`);
    }

    const emoji = await expressionRepository.createEmoji({
      guildId,
      name: input.name,
      url: input.url,
      animated: input.animated ?? false,
      createdById: userId,
    });

    auditService.register({
      guildId,
      actorId: userId,
      action: "emoji.create",
      targetType: "emoji",
      targetId: emoji.id,
      targetName: emoji.name,
    });

    return toGuildEmoji(emoji);
  },

  async renameEmoji(userId: string, guildId: string, emojiId: string, name: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_EXPRESSIONS");

    const emoji = await expressionRepository.findEmojiById(emojiId);
    if (!emoji || emoji.guildId !== guildId) throw new NotFoundError("Emoji não encontrado");

    const updated = await expressionRepository.updateEmoji(emojiId, { name });

    auditService.register({
      guildId,
      actorId: userId,
      action: "emoji.update",
      targetType: "emoji",
      targetId: emojiId,
      targetName: name,
      changes: { name: { de: emoji.name, toward: name } },
    });

    return toGuildEmoji(updated);
  },

  async removeEmoji(userId: string, guildId: string, emojiId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_EXPRESSIONS");

    const emoji = await expressionRepository.findEmojiById(emojiId);
    if (!emoji || emoji.guildId !== guildId) throw new NotFoundError("Emoji não encontrado");

    await expressionRepository.removeEmoji(emojiId);
    auditService.register({
      guildId,
      actorId: userId,
      action: "emoji.delete",
      targetType: "emoji",
      targetId: emojiId,
      targetName: emoji.name,
    });
  },

  async createSticker(userId: string, guildId: string, input: CreateStickerInput) {
    await requireCanCreateExpression(userId, guildId);

    if ((await expressionRepository.countStickers(guildId)) >= LIMITS.stickersByServer) {
      throw new AppError(`O servidor já tem ${LIMITS.stickersByServer} figurinhas`);
    }

    const sticker = await expressionRepository.createSticker({
      guildId,
      name: input.name,
      description: input.description ?? null,
      relatedEmoji: input.relatedEmoji,
      url: input.url,
      createdById: userId,
    });

    auditService.register({
      guildId,
      actorId: userId,
      action: "sticker.create",
      targetType: "sticker",
      targetId: sticker.id,
      targetName: sticker.name,
    });

    return toSticker(sticker);
  },

  async removeSticker(userId: string, guildId: string, stickerId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_EXPRESSIONS");

    const sticker = await expressionRepository.findStickerById(stickerId);
    if (!sticker || sticker.guildId !== guildId) throw new NotFoundError("Figurinha não encontrada");

    await expressionRepository.removeSticker(stickerId);
    auditService.register({
      guildId,
      actorId: userId,
      action: "sticker.delete",
      targetType: "sticker",
      targetId: stickerId,
      targetName: sticker.name,
    });
  },

  async createSound(userId: string, guildId: string, input: CreateSoundInput) {
    await requireCanCreateExpression(userId, guildId);

    if ((await expressionRepository.countSounds(guildId)) >= LIMITS.soundsByServer) {
      throw new AppError(`O servidor já tem ${LIMITS.soundsByServer} sons`);
    }

    const sound = await expressionRepository.createSound({
      guildId,
      name: input.name,
      emoji: input.emoji ?? null,
      url: input.url,
      volume: input.volume ?? 1,
      createdById: userId,
    });

    auditService.register({
      guildId,
      actorId: userId,
      action: "sound.create",
      targetType: "sound",
      targetId: sound.id,
      targetName: sound.name,
    });

    return toGuildSound(sound);
  },

  async updateSound(
    userId: string,
    guildId: string,
    soundId: string,
    input: { name?: string; emoji?: string | null; volume?: number },
  ) {
    await accessService.requirePermission(userId, guildId, "MANAGE_EXPRESSIONS");

    const sound = await expressionRepository.findSoundById(soundId);
    if (!sound || sound.guildId !== guildId) throw new NotFoundError("Som não encontrado");

    return toGuildSound(await expressionRepository.updateSound(soundId, input));
  },

  async removeSound(userId: string, guildId: string, soundId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_EXPRESSIONS");

    const sound = await expressionRepository.findSoundById(soundId);
    if (!sound || sound.guildId !== guildId) throw new NotFoundError("Som não encontrado");

    await expressionRepository.removeSound(soundId);
    auditService.register({
      guildId,
      actorId: userId,
      action: "sound.delete",
      targetType: "sound",
      targetId: soundId,
      targetName: sound.name,
    });
  },
};

async function requireCanCreateExpression(userId: string, guildId: string) {
  const context = await accessService.contextOf(userId, guildId);

  if (
    !has(context.permissions, "CREATE_EXPRESSIONS") &&
    !has(context.permissions, "MANAGE_EXPRESSIONS")
  ) {
    throw new ForbiddenError("Você não pode criar expressões neste servidor");
  }

  return context;
}
