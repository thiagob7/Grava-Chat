import { NotFoundError } from "~/lib/http.js";
import { autoModRepository } from "~/repositories/automod-repository.js";
import { accessService } from "./access-service.js";
import { auditService } from "./audit-service.js";
import type { AutoModRuleInput } from "~/validations/moderation.js";

export const autoModCrud = {
  async list(userId: string, guildId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");
    return autoModRepository.findManyByGuild(guildId);
  },

  async create(userId: string, guildId: string, input: AutoModRuleInput) {
    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");

    const rule = await autoModRepository.create({
      guildId,
      name: input.name,
      enabled: input.enabled ?? true,
      trigger: input.trigger,
      words: (input.words ?? []).map((p) => p.toLowerCase().trim()).filter(Boolean),
      limitMentions: input.limitMentions ?? null,
      actions: input.actions,
      alertChannelId: input.alertChannelId ?? null,
      timeoutSeconds: input.timeoutSeconds ?? null,
      rolesExempt: input.rolesExempt ?? [],
    });

    auditService.register({
      guildId,
      actorId: userId,
      action: "automod.create",
      targetType: "automod",
      targetId: rule.id,
      targetName: rule.name,
    });

    return rule;
  },

  async update(userId: string, guildId: string, ruleId: string, input: Partial<AutoModRuleInput>) {
    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");

    const rule = await autoModRepository.findById(ruleId);
    if (!rule || rule.guildId !== guildId) throw new NotFoundError("Regra não encontrada");

    const updated = await autoModRepository.update(ruleId, {
      ...input,
      ...(input.words
        ? { words: input.words.map((p) => p.toLowerCase().trim()).filter(Boolean) }
        : {}),
    });

    auditService.register({
      guildId,
      actorId: userId,
      action: "automod.update",
      targetType: "automod",
      targetId: ruleId,
      targetName: updated.name,
    });

    return updated;
  },

  async remove(userId: string, guildId: string, ruleId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");

    const rule = await autoModRepository.findById(ruleId);
    if (!rule || rule.guildId !== guildId) throw new NotFoundError("Regra não encontrada");

    await autoModRepository.remove(ruleId);
    auditService.register({
      guildId,
      actorId: userId,
      action: "automod.delete",
      targetType: "automod",
      targetId: ruleId,
      targetName: rule.name,
    });
  },
};
