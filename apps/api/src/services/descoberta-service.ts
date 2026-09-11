import {
  COMMUNITY_CATEGORIES,
  MEMBERS_FOR_DISCOVER,
  type CommunityCategory,
  type CommunityDiscovery,
} from "@gravae/shared";

import { AppError } from "~/lib/http.js";
import { banRepository } from "~/repositories/ban-repository.js";
import { discoveryRepository, memberRepository } from "~/repositories/guild-repository.js";
import { presenceService } from "~/services/presence-service.js";
import { toMember } from "~/lib/serialize.js";

const isCategory = (value: string | null): value is CommunityCategory =>
  value !== null && (COMMUNITY_CATEGORIES as readonly string[]).includes(value);

export const discoveryService = {
  async list(
    userId: string,
    filter: { category?: string; search?: string },
  ): Promise<CommunityDiscovery[]> {
    const category = isCategory(filter.category ?? null) ? filter.category! : null;
    const search = filter.search?.trim() || null;

    const candidates = await discoveryRepository.candidates(category, search);

    const large = candidates.filter(
      (guild) => guild.verified || guild._count.members >= MEMBERS_FOR_DISCOVER,
    );

    if (!large.length) return [];

    const membersByServer = await discoveryRepository.members(
      large.map((guild) => guild.id),
    );

    const allMembers = [...new Set([...membersByServer.values()].flat())];
    const presence = await presenceService.mapFor(allMembers);

    return large
      .map((guild) => {
        const members = membersByServer.get(guild.id) ?? [];

        return {
          id: guild.id,
          name: guild.name,
          iconUrl: guild.iconUrl,
          bannerUrl: guild.bannerUrl,
          description: guild.description,
          category: isCategory(guild.category) ? guild.category : null,
          members: guild._count.members,
          online: members.filter((id) => presence[id] && presence[id] !== "OFFLINE").length,
          alreadyAmMember: members.includes(userId),
          verified: Boolean(guild.verified),
        };
      })
      .sort((a, b) => b.members - a.members);
  },

  async join(userId: string, guildId: string) {
    const candidates = await discoveryRepository.candidates(null, null);

    const isOpen = candidates.find(
      (guild) =>
        guild.id === guildId &&
        (guild.verified || guild._count.members >= MEMBERS_FOR_DISCOVER),
    );

    if (!isOpen) throw new AppError("Esta comunidade não está no Explorar", 404);

    if (await banRepository.find(guildId, userId)) {
      throw new AppError("Você está banido deste servidor", 403);
    }

    const existing = await memberRepository.find(guildId, userId);
    if (existing) return { guildId, alreadyWasMember: true as const, member: null };

    const member = await memberRepository.create({ guildId, userId });

    return { guildId, alreadyWasMember: false as const, member: toMember(member) };
  },
};
