import { NotFoundError } from "~/lib/http.js";
import { autoModRepository } from "~/repositories/automod-repository.js";
import { accessService } from "./access-service.js";
import { auditService } from "./audit-service.js";
import type { AutoModRuleInput } from "~/validations/moderation.js";

/** A parte "de tela" do AutoMod: listar, criar, ligar/desligar e apagar regra. */
export const autoModCrud = {
  async list(userId: string, guildId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");
    return autoModRepository.findManyByGuild(guildId);
  },

  async create(userId: string, guildId: string, input: AutoModRuleInput) {
    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");

    const regra = await autoModRepository.create({
      guildId,
      name: input.name,
      enabled: input.enabled ?? true,
      trigger: input.trigger,
      // guardar já em minúsculas evita normalizar a lista inteira a cada mensagem
      palavras: (input.palavras ?? []).map((p) => p.toLowerCase().trim()).filter(Boolean),
      limiteMencoes: input.limiteMencoes ?? null,
      acoes: input.acoes,
      alertChannelId: input.alertChannelId ?? null,
      timeoutSeconds: input.timeoutSeconds ?? null,
      cargosIsentos: input.cargosIsentos ?? [],
    });

    auditService.registrar({
      guildId,
      actorId: userId,
      action: "automod.create",
      targetType: "automod",
      targetId: regra.id,
      targetName: regra.name,
    });

    return regra;
  },

  async update(userId: string, guildId: string, ruleId: string, input: Partial<AutoModRuleInput>) {
    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");

    const regra = await autoModRepository.findById(ruleId);
    if (!regra || regra.guildId !== guildId) throw new NotFoundError("Regra não encontrada");

    const atualizada = await autoModRepository.update(ruleId, {
      ...input,
      ...(input.palavras
        ? { palavras: input.palavras.map((p) => p.toLowerCase().trim()).filter(Boolean) }
        : {}),
    });

    auditService.registrar({
      guildId,
      actorId: userId,
      action: "automod.update",
      targetType: "automod",
      targetId: ruleId,
      targetName: atualizada.name,
    });

    return atualizada;
  },

  async remove(userId: string, guildId: string, ruleId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");

    const regra = await autoModRepository.findById(ruleId);
    if (!regra || regra.guildId !== guildId) throw new NotFoundError("Regra não encontrada");

    await autoModRepository.remove(ruleId);
    auditService.registrar({
      guildId,
      actorId: userId,
      action: "automod.delete",
      targetType: "automod",
      targetId: ruleId,
      targetName: regra.name,
    });
  },
};
