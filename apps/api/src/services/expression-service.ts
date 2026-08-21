import { LIMITS } from "@gravae/shared";
import { AppError, NotFoundError } from "~/lib/http.js";
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

/**
 * Emoji, figurinha e som do servidor.
 *
 * O arquivo já subiu para o storage antes de chegar aqui (o mesmo caminho dos
 * anexos): o que este service guarda é o endereço e o nome. Assim não existe
 * um segundo jeito de subir arquivo no sistema.
 */
export const expressionService = {
  /** Tudo de uma vez: o seletor do compositor precisa das três listas juntas. */
  async list(userId: string, guildId: string) {
    await accessService.requireMember(userId, guildId);

    const [emojis, stickers, sounds] = await Promise.all([
      expressionRepository.findEmojisByGuild(guildId),
      expressionRepository.findStickersByGuild(guildId),
      expressionRepository.findSoundsByGuild(guildId),
    ]);

    const autores = await userRepository.findManyByIds([
      ...new Set([...emojis, ...stickers, ...sounds].map((e) => e.createdById)),
    ]);
    const porId = new Map(autores.map((u) => [u.id, toPublicUser(u)]));

    return {
      emojis: emojis.map((e) => ({ ...toGuildEmoji(e), createdBy: porId.get(e.createdById) ?? null })),
      stickers: stickers.map((s) => ({ ...toSticker(s), createdBy: porId.get(s.createdById) ?? null })),
      sounds: sounds.map((s) => ({ ...toGuildSound(s), createdBy: porId.get(s.createdById) ?? null })),
    };
  },

  // ------------------------------------------------------------------ emoji
  async createEmoji(userId: string, guildId: string, input: CreateEmojiInput) {
    await accessService.requirePermission(userId, guildId, "MANAGE_EXPRESSIONS");

    if ((await expressionRepository.countEmojis(guildId)) >= LIMITS.emojisPorServidor) {
      throw new AppError(`O servidor já tem ${LIMITS.emojisPorServidor} emojis`);
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

    auditService.registrar({
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

    const atualizado = await expressionRepository.updateEmoji(emojiId, { name });

    auditService.registrar({
      guildId,
      actorId: userId,
      action: "emoji.update",
      targetType: "emoji",
      targetId: emojiId,
      targetName: name,
      changes: { name: { de: emoji.name, para: name } },
    });

    return toGuildEmoji(atualizado);
  },

  async removeEmoji(userId: string, guildId: string, emojiId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_EXPRESSIONS");

    const emoji = await expressionRepository.findEmojiById(emojiId);
    if (!emoji || emoji.guildId !== guildId) throw new NotFoundError("Emoji não encontrado");

    await expressionRepository.removeEmoji(emojiId);
    auditService.registrar({
      guildId,
      actorId: userId,
      action: "emoji.delete",
      targetType: "emoji",
      targetId: emojiId,
      targetName: emoji.name,
    });
  },

  // -------------------------------------------------------------- figurinha
  async createSticker(userId: string, guildId: string, input: CreateStickerInput) {
    await accessService.requirePermission(userId, guildId, "MANAGE_EXPRESSIONS");

    if ((await expressionRepository.countStickers(guildId)) >= LIMITS.figurinhasPorServidor) {
      throw new AppError(`O servidor já tem ${LIMITS.figurinhasPorServidor} figurinhas`);
    }

    const sticker = await expressionRepository.createSticker({
      guildId,
      name: input.name,
      description: input.description ?? null,
      relatedEmoji: input.relatedEmoji,
      url: input.url,
      createdById: userId,
    });

    auditService.registrar({
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
    auditService.registrar({
      guildId,
      actorId: userId,
      action: "sticker.delete",
      targetType: "sticker",
      targetId: stickerId,
      targetName: sticker.name,
    });
  },

  // ------------------------------------------------------------------- som
  async createSound(userId: string, guildId: string, input: CreateSoundInput) {
    await accessService.requirePermission(userId, guildId, "MANAGE_EXPRESSIONS");

    if ((await expressionRepository.countSounds(guildId)) >= LIMITS.sonsPorServidor) {
      throw new AppError(`O servidor já tem ${LIMITS.sonsPorServidor} sons`);
    }

    const sound = await expressionRepository.createSound({
      guildId,
      name: input.name,
      emoji: input.emoji ?? null,
      url: input.url,
      volume: input.volume ?? 1,
      createdById: userId,
    });

    auditService.registrar({
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
    auditService.registrar({
      guildId,
      actorId: userId,
      action: "sound.delete",
      targetType: "sound",
      targetId: soundId,
      targetName: sound.name,
    });
  },
};
