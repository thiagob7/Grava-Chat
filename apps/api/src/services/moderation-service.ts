import { highestPosition } from "@gravae/shared";
import { AppError, NotFoundError } from "~/lib/http.js";
import { toMember, toPublicUser } from "~/lib/serialize.js";
import { banRepository } from "~/repositories/ban-repository.js";
import { guildRepository, memberRepository } from "~/repositories/guild-repository.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { roleRepository } from "~/repositories/role-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService, type Contexto } from "./access-service.js";
import { auditService } from "./audit-service.js";
import type { BanInput, TimeoutInput } from "~/validations/moderation.js";

async function requireAcimaDoAlvo(contexto: Contexto, guildId: string, targetId: string) {
  const guild = await guildRepository.findById(guildId);
  if (!guild) throw new NotFoundError("Servidor não encontrado");
  if (guild.ownerId === targetId) throw new AppError("O dono do servidor não pode ser moderado", 403);

  const alvo = await memberRepository.find(guildId, targetId);
  if (!alvo) return;

  const roles = await roleRepository.findForMember(guildId, alvo.roleIds);
  accessService.requireAbove(
    contexto,
    highestPosition(roles),
    "Esta pessoa está acima de você na hierarquia",
  );
}

export const moderationService = {
  async listBans(userId: string, guildId: string) {
    await accessService.requirePermission(userId, guildId, "BAN_MEMBERS");

    const bans = await banRepository.findManyByGuild(guildId);
    const moderadores = await userRepository.findManyByIds([...new Set(bans.map((b) => b.moderatorId))]);
    const porId = new Map(moderadores.map((u) => [u.id, toPublicUser(u)]));

    return bans.map((b) => ({
      user: toPublicUser(b.user),
      moderator: porId.get(b.moderatorId) ?? null,
      reason: b.reason,
      createdAt: b.createdAt.toISOString(),
    }));
  },

  async ban(actorId: string, guildId: string, targetId: string, input: BanInput) {
    const contexto = await accessService.requirePermission(actorId, guildId, "BAN_MEMBERS");
    await requireAcimaDoAlvo(contexto, guildId, targetId);

    if (await banRepository.find(guildId, targetId)) throw new AppError("Esta pessoa já está banida");

    const alvo = await userRepository.findByIdOrThrow(targetId);
    const ban = await banRepository.create({
      guildId,
      userId: targetId,
      moderatorId: actorId,
      reason: input.reason ?? null,
    });

    await memberRepository.remove(guildId, targetId).catch(() => undefined);

    if (input.apagarHoras) {
      await messageRepository.softDeleteRecentByAuthor(
        guildId,
        targetId,
        new Date(Date.now() - input.apagarHoras * 3600_000),
      );
    }

    auditService.registrar({
      guildId,
      actorId,
      action: "member.ban",
      targetType: "member",
      targetId,
      targetName: alvo.displayName,
      reason: input.reason ?? undefined,
    });

    return { user: toPublicUser(ban.user), reason: ban.reason, createdAt: ban.createdAt.toISOString() };
  },

  async unban(actorId: string, guildId: string, targetId: string) {
    await accessService.requirePermission(actorId, guildId, "BAN_MEMBERS");

    const ban = await banRepository.find(guildId, targetId);
    if (!ban) throw new NotFoundError("Esta pessoa não está banida");

    await banRepository.remove(guildId, targetId);
    const alvo = await userRepository.findById(targetId);

    auditService.registrar({
      guildId,
      actorId,
      action: "member.unban",
      targetType: "member",
      targetId,
      targetName: alvo?.displayName,
    });
  },

  async castigar(actorId: string, guildId: string, targetId: string, input: TimeoutInput) {
    const contexto = await accessService.requirePermission(actorId, guildId, "MODERATE_MEMBERS");
    await requireAcimaDoAlvo(contexto, guildId, targetId);

    const ate = input.minutos ? new Date(Date.now() + input.minutos * 60_000) : null;
    const member = await memberRepository.setTimeout(guildId, targetId, ate);

    auditService.registrar({
      guildId,
      actorId,
      action: ate ? "member.timeout" : "member.timeout_remove",
      targetType: "member",
      targetId,
      targetName: member.user.displayName,
      reason: input.reason ?? undefined,
      changes: ate ? { timeoutUntil: { de: null, para: ate.toISOString() } } : undefined,
    });

    return toMember(member);
  },

  async apelidar(actorId: string, guildId: string, targetId: string, nickname: string | null) {
    if (actorId === targetId) {
      await accessService.requirePermission(actorId, guildId, "CHANGE_NICKNAME");
    } else {
      const contexto = await accessService.requirePermission(actorId, guildId, "MANAGE_NICKNAMES");
      await requireAcimaDoAlvo(contexto, guildId, targetId);
    }

    const member = await memberRepository.setNickname(guildId, targetId, nickname);

    auditService.registrar({
      guildId,
      actorId,
      action: "member.nickname",
      targetType: "member",
      targetId,
      targetName: member.user.displayName,
      changes: { nickname: { de: null, para: nickname } },
    });

    return toMember(member);
  },
};
