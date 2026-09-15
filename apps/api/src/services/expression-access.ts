import { customEmojiIds, parseCustomEmoji } from "@gravae/shared";

import { AppError } from "~/lib/http.js";
import { expressionRepository } from "~/repositories/expression-repository.js";
import { memberRepository } from "~/repositories/guild-repository.js";
import { planService } from "~/services/plan-service.js";

const MAX_EMOJIS_RESOLVED = 50;

async function requireForeignUse(userId: string, foreignGuildIds: string[], what: string) {
  if (!foreignGuildIds.length) return;

  await planService.requireFeature(userId, "expressionsAnywhere", `${what} de outro servidor é do Infinity`);

  const memberships = await Promise.all(foreignGuildIds.map((guildId) => memberRepository.find(guildId, userId)));
  if (memberships.some((member) => !member)) {
    throw new AppError(`Você precisa estar no servidor desse ${what.toLowerCase()} para usar`, 403);
  }
}

export const expressionAccess = {
  async requireEmojisInText(userId: string, channelGuildId: string | null, text: string) {
    const ids = customEmojiIds(text).slice(0, MAX_EMOJIS_RESOLVED);
    if (!ids.length) return;

    const emojis = await expressionRepository.findEmojisByIds(ids);
    const foreign = [...new Set(emojis.filter((e) => e.guildId !== channelGuildId).map((e) => e.guildId))];

    await requireForeignUse(userId, foreign, "Emoji");
  },

  async requireReaction(userId: string, channelGuildId: string | null, emoji: string) {
    const ref = parseCustomEmoji(emoji);
    if (!ref) return;

    const found = await expressionRepository.findEmojiById(ref.id);
    if (!found) throw new AppError("Emoji não encontrado", 404);
    if (found.guildId !== channelGuildId) await requireForeignUse(userId, [found.guildId], "Emoji");
  },

  async requireSticker(userId: string, channelGuildId: string | null, sticker: { guildId: string }) {
    if (sticker.guildId !== channelGuildId) await requireForeignUse(userId, [sticker.guildId], "Figurinha");
  },

  async describeEmojis(ids: string[]) {
    const emojis = await expressionRepository.findEmojisByIds(ids.slice(0, MAX_EMOJIS_RESOLVED));
    return emojis.map((e) => ({ id: e.id, guildId: e.guildId, name: e.name, url: e.url, animated: e.animated }));
  },
};
