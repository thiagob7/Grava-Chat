import type { Badge } from "@gravae/shared";
import { LIMITS } from "@gravae/shared";
import { AppError, NotFoundError } from "~/lib/http.js";
import { badgeRepository, memberRepository } from "~/repositories/guild-repository.js";
import { accessService } from "./access-service.js";
import { auditService } from "./audit-service.js";

export const badgeService = {
  async list(userId: string, guildId: string): Promise<Badge[]> {
    await accessService.requireMember(userId, guildId);
    return (await badgeRepository.findManyByGuild(guildId)).map(forDto);
  },

  async create(
    userId: string,
    guildId: string,
    input: { name: string; emoji?: string | null; iconUrl?: string | null },
  ): Promise<Badge> {
    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");

    const count = await badgeRepository.countByGuild(guildId);
    if (count >= LIMITS.badgesByServer) {
      throw new AppError(`Este servidor ja tem ${LIMITS.badgesByServer} emblemas`);
    }

    const emoji = input.emoji?.trim() || null;
    const iconUrl = emoji ? null : (input.iconUrl ?? null);
    if (!emoji && !iconUrl) throw new AppError("O emblema precisa de um emoji ou de uma imagem");

    const created = await badgeRepository.create({
      guildId,
      name: input.name.trim(),
      emoji,
      iconUrl,
      createdById: userId,
    });

    auditService.register({
      guildId,
      actorId: userId,
      action: "emblema.create",
      targetType: "emblema",
      targetId: created.id,
      targetName: created.name,
    });

    return forDto(created);
  },

  async remove(userId: string, guildId: string, badgeId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");

    const badge = await badgeRepository.findById(badgeId);
    if (!badge || badge.guildId !== guildId) throw new NotFoundError("Emblema nao encontrado");

    await badgeRepository.remove(badgeId);
    await memberRepository.removeAllBadge(guildId, badgeId);

    auditService.register({
      guildId,
      actorId: userId,
      action: "emblema.delete",
      targetType: "emblema",
      targetId: badgeId,
      targetName: badge.name,
    });

    return { id: badgeId };
  },

  async wear(userId: string, guildId: string, emblemIds: string[]) {
    const member = await accessService.requireMember(userId, guildId);

    if (emblemIds.length > LIMITS.badgesByMember) {
      throw new AppError(`No maximo ${LIMITS.badgesByMember} emblemas de uma vez`);
    }

    const fromServer = new Set((await badgeRepository.findManyByGuild(guildId)).map((e) => e.id));
    const picked = [...new Set(emblemIds)].filter((id) => fromServer.has(id));

    await memberRepository.setBadges(member.id, picked);
    return { emblemIds: picked };
  },
};

const forDto = (e: {
  id: string;
  guildId: string;
  name: string;
  emoji: string | null;
  iconUrl: string | null;
}): Badge => ({
  id: e.id,
  guildId: e.guildId,
  name: e.name,
  emoji: e.emoji,
  iconUrl: e.iconUrl,
});
