import { AppError, NotFoundError } from "~/lib/http.js";
import { toMember, toPublicUser } from "~/lib/serialize.js";
import { banRepository } from "~/repositories/ban-repository.js";
import { guildRepository, memberRepository } from "~/repositories/guild-repository.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService, type Context } from "./access-service.js";
import { auditService } from "./audit-service.js";
import { uploadService } from "./upload-service.js";
import type { BanInput, TimeoutInput } from "~/validations/moderation.js";

export const moderationService = {
  async listBans(userId: string, guildId: string) {
    await accessService.requirePermission(userId, guildId, "BAN_MEMBERS");

    const bans = await banRepository.findManyByGuild(guildId);
    const moderators = await userRepository.findManyByIds([...new Set(bans.map((b) => b.moderatorId))]);
    const byId = new Map(moderators.map((u) => [u.id, toPublicUser(u)]));

    return bans.map((b) => ({
      user: toPublicUser(b.user),
      moderator: byId.get(b.moderatorId) ?? null,
      reason: b.reason,
      createdAt: b.createdAt.toISOString(),
    }));
  },

  async ban(actorId: string, guildId: string, targetId: string, input: BanInput) {
    const context = await accessService.requirePermission(actorId, guildId, "BAN_MEMBERS");
    await accessService.targetRequireAbove(context, guildId, targetId);

    if (await banRepository.find(guildId, targetId)) throw new AppError("Esta pessoa já está banida");

    const target = await userRepository.findByIdOrThrow(targetId);
    const ban = await banRepository.create({
      guildId,
      userId: targetId,
      moderatorId: actorId,
      reason: input.reason ?? null,
    });

    await memberRepository.remove(guildId, targetId).catch(() => undefined);

    if (input.deleteHours) {
      const orphans = await messageRepository.softDeleteRecentByAuthor(
        guildId,
        targetId,
        new Date(Date.now() - input.deleteHours * 3600_000),
      );

      void uploadService.remove(orphans);
    }

    auditService.register({
      guildId,
      actorId,
      action: "member.ban",
      targetType: "member",
      targetId,
      targetName: target.displayName,
      reason: input.reason ?? undefined,
    });

    return { user: toPublicUser(ban.user), reason: ban.reason, createdAt: ban.createdAt.toISOString() };
  },

  async unban(actorId: string, guildId: string, targetId: string) {
    await accessService.requirePermission(actorId, guildId, "BAN_MEMBERS");

    const ban = await banRepository.find(guildId, targetId);
    if (!ban) throw new NotFoundError("Esta pessoa não está banida");

    await banRepository.remove(guildId, targetId);
    const target = await userRepository.findById(targetId);

    auditService.register({
      guildId,
      actorId,
      action: "member.unban",
      targetType: "member",
      targetId,
      targetName: target?.displayName,
    });
  },

  async timeout(actorId: string, guildId: string, targetId: string, input: TimeoutInput) {
    const context = await accessService.requirePermission(actorId, guildId, "MODERATE_MEMBERS");
    await accessService.targetRequireAbove(context, guildId, targetId);

    const until = input.minutes ? new Date(Date.now() + input.minutes * 60_000) : null;
    const member = await memberRepository.setTimeout(guildId, targetId, until);

    auditService.register({
      guildId,
      actorId,
      action: until ? "member.timeout" : "member.timeout_remove",
      targetType: "member",
      targetId,
      targetName: member.user.displayName,
      reason: input.reason ?? undefined,
      changes: until ? { timeoutUntil: { de: null, toward: until.toISOString() } } : undefined,
    });

    return toMember(member);
  },

  async nickname(actorId: string, guildId: string, targetId: string, nickname: string | null) {
    if (actorId === targetId) {
      await accessService.requirePermission(actorId, guildId, "CHANGE_NICKNAME");
    } else {
      const context = await accessService.requirePermission(actorId, guildId, "MANAGE_NICKNAMES");
      await accessService.targetRequireAbove(context, guildId, targetId);
    }

    const member = await memberRepository.setNickname(guildId, targetId, nickname);

    auditService.register({
      guildId,
      actorId,
      action: "member.nickname",
      targetType: "member",
      targetId,
      targetName: member.user.displayName,
      changes: { nickname: { de: null, toward: nickname } },
    });

    return toMember(member);
  },
};
