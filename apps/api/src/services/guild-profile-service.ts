import { NotFoundError } from "~/lib/http.js";
import { toMember } from "~/lib/serialize.js";
import { memberRepository } from "~/repositories/guild-repository.js";
import { planService } from "~/services/plan-service.js";
import type { GuildProfileInput } from "~/validations/guild-profile.js";

export const guildProfileService = {
  async update(userId: string, guildId: string, input: GuildProfileInput) {
    const member = await memberRepository.find(guildId, userId);
    if (!member) throw new NotFoundError("Você não está nesse servidor");

    const setsSomething = [input.avatarUrl, input.bannerUrl, input.bio].some((value) => value);
    if (setsSomething) {
      await planService.requireFeature(userId, "guildProfiles", "Perfil por comunidade é do Infinity");
    }

    const data = {
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.bannerUrl !== undefined ? { bannerUrl: input.bannerUrl } : {}),
      ...(input.bio !== undefined ? { bio: input.bio?.trim() || null } : {}),
    };

    return toMember(await memberRepository.setGuildProfile(guildId, userId, data));
  },
};
