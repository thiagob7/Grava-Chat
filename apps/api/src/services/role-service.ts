import { highestPosition, type Permission } from "@gravae/shared";
import { AppError, ForbiddenError, NotFoundError } from "~/lib/http.js";
import { toMember, toRole } from "~/lib/serialize.js";
import { memberRepository, channelRepository } from "~/repositories/guild-repository.js";
import { roleRepository, overwriteRepository } from "~/repositories/role-repository.js";
import { accessService, requireGrantable } from "./access-service.js";
import { auditService, difference } from "./audit-service.js";
import type {
  CreateRoleInput,
  ReorderRolesInput,
  SetMemberRolesInput,
  SetOverwriteInput,
  UpdateRoleInput,
} from "~/validations/role.js";

async function roleDoGuild(guildId: string, roleId: string) {
  const role = await roleRepository.findById(roleId);
  if (!role || role.guildId !== guildId) throw new NotFoundError("Cargo não encontrado");
  return role;
}

export const roleService = {
  async list(userId: string, guildId: string) {
    await accessService.requireMember(userId, guildId);

    const [roles, count] = await Promise.all([
      roleRepository.findManyByGuild(guildId),
      roleRepository.countMembersByRole(guildId),
    ]);

    return roles.map((r) => ({
      ...toRole(r),
      memberCount: r.isEveryone ? undefined : (count[r.id] ?? 0),
    }));
  },

  async create(userId: string, guildId: string, input: CreateRoleInput) {
    const context = await accessService.requirePermission(userId, guildId, "MANAGE_ROLES");
    const permissions = input.permissions ?? [];
    requireGrantable(context, permissions);

    const existing = await roleRepository.findManyByGuild(guildId);
    if (existing.length >= 50) throw new AppError("Limite de 50 cargos por servidor");

    await Promise.all(
      existing
        .filter((r) => !r.isEveryone)
        .map((r) => roleRepository.update(r.id, { position: r.position + 1 })),
    );

    const { iconEmoji, iconUrl } = normalizeIcon(input);

    const role = await roleRepository.create({
      guildId,
      name: input.name,
      color: input.color ?? null,
      colorSecondary: input.colorSecondary ?? null,
      style: input.style ?? "solido",
      iconEmoji: iconEmoji ?? null,
      iconUrl: iconUrl ?? null,
      position: 1,
      permissions,
      hoist: input.hoist ?? false,
      mentionable: input.mentionable ?? false,
    });

    auditService.register({
      guildId,
      actorId: userId,
      action: "role.create",
      targetType: "role",
      targetId: role.id,
      targetName: role.name,
      changes: difference({} as Record<string, unknown>, {
        name: role.name,
        color: role.color,
        permissions: role.permissions.length ? role.permissions : undefined,
        hoist: role.hoist || undefined,
        mentionable: role.mentionable || undefined,
      }),
    });

    return toRole(role);
  },

  async update(userId: string, guildId: string, roleId: string, input: UpdateRoleInput) {
    const context = await accessService.requirePermission(userId, guildId, "MANAGE_ROLES");
    const role = await roleDoGuild(guildId, roleId);

    accessService.requireAbove(context, role.position, "Este cargo está acima do seu");
    if (input.permissions) requireGrantable(context, input.permissions);

    const touchesAppearance = [
      input.name,
      input.color,
      input.colorSecondary,
      input.style,
      input.iconEmoji,
      input.iconUrl,
      input.hoist,
    ].some((v) => v !== undefined);

    if (role.isEveryone && touchesAppearance) {
      throw new AppError("O cargo @everyone só aceita mudança de permissões");
    }

    const updated = await roleRepository.update(roleId, normalizeIcon(input));

    auditService.register({
      guildId,
      actorId: userId,
      action: "role.update",
      targetType: "role",
      targetId: roleId,
      targetName: updated.name,
      changes: difference(role as unknown as Record<string, unknown>, input as Record<string, unknown>),
    });

    return toRole(updated);
  },

  async remove(userId: string, guildId: string, roleId: string) {
    const context = await accessService.requirePermission(userId, guildId, "MANAGE_ROLES");
    const role = await roleDoGuild(guildId, roleId);

    if (role.isEveryone) throw new AppError("O cargo @everyone não pode ser apagado");
    accessService.requireAbove(context, role.position, "Este cargo está acima do seu");

    await memberRepository.pullRole(guildId, roleId);
    await roleRepository.remove(roleId);

    auditService.register({
      guildId,
      actorId: userId,
      action: "role.delete",
      targetType: "role",
      targetId: roleId,
      targetName: role.name,
    });
  },

  async reorder(userId: string, guildId: string, input: ReorderRolesInput) {
    const context = await accessService.requirePermission(userId, guildId, "MANAGE_ROLES");
    const current = await roleRepository.findManyByGuild(guildId);
    const byId = new Map(current.map((r) => [r.id, r]));

    for (const item of input.roles) {
      const role = byId.get(item.id);
      if (!role) throw new NotFoundError("Cargo não encontrado");
      if (role.isEveryone) throw new AppError("O @everyone fica sempre embaixo");

      accessService.requireAbove(context, role.position, "Este cargo está acima do seu");
      accessService.requireAbove(context, item.position, "Você não pode mover um cargo para cima do seu");
    }

    await Promise.all(input.roles.map((r) => roleRepository.update(r.id, { position: r.position })));
    return roleService.list(userId, guildId);
  },

  async setMemberRoles(
    actorId: string,
    guildId: string,
    targetId: string,
    input: SetMemberRolesInput,
  ) {
    const context = await accessService.requirePermission(actorId, guildId, "MANAGE_ROLES");

    const target = await memberRepository.find(guildId, targetId);
    if (!target) throw new NotFoundError("Membro não encontrado");

    const roles = await roleRepository.findManyByGuild(guildId);
    const byId = new Map(roles.map((r) => [r.id, r]));

    const before = new Set(target.roleIds);
    const after = new Set(input.roleIds);
    const changed = [...new Set([...before, ...after])].filter(
      (id) => before.has(id) !== after.has(id),
    );

    for (const id of changed) {
      const role = byId.get(id);
      if (!role) throw new NotFoundError("Cargo não encontrado");
      if (role.isEveryone) throw new AppError("O @everyone é de todos e não se atribui");
      accessService.requireAbove(context, role.position, `Você não pode atribuir "${role.name}"`);
    }

    const targetCurrent = roles.filter((r) => target.roleIds.includes(r.id));
    accessService.requireAbove(
      context,
      highestPosition(targetCurrent),
      "Esta pessoa está acima de você na hierarquia",
    );

    const updated = await memberRepository.setRoles(guildId, targetId, [...after]);

    if (changed.length) {
      const names = (ids: string[]) => ids.map((id) => byId.get(id)?.name ?? id);
      auditService.register({
        guildId,
        actorId,
        action: "member.roles",
        targetType: "member",
        targetId,
        targetName: updated.user?.displayName ?? null,
        changes: {
          ...(changed.some((id) => after.has(id))
            ? { added: { de: null, toward: names(changed.filter((id) => after.has(id))) } }
            : {}),
          ...(changed.some((id) => before.has(id))
            ? { removed: { de: null, toward: names(changed.filter((id) => before.has(id))) } }
            : {}),
        },
      });
    }

    return toMember(updated);
  },

  async listOverwrites(userId: string, guildId: string, channelId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_ROLES", channelId);

    const overwrites = await overwriteRepository.findManyByChannel(channelId);
    return overwrites.map((o) => ({
      channelId: o.channelId,
      targetId: o.targetId,
      type: o.type,
      allow: o.allow,
      deny: o.deny,
    }));
  },

  async setOverwrite(
    userId: string,
    guildId: string,
    channelId: string,
    targetId: string,
    input: SetOverwriteInput,
  ) {
    const context = await accessService.requirePermission(userId, guildId, "MANAGE_ROLES", channelId);
    requireGrantable(context, [...input.allow, ...input.deny]);

    const channel = await channelRepository.findById(channelId);
    if (!channel || channel.guildId !== guildId) throw new NotFoundError("Canal não encontrado");

    if (input.type === "ROLE") {
      const role = await roleDoGuild(guildId, targetId);
      if (!role.isEveryone) {
        accessService.requireAbove(context, role.position, "Este cargo está acima do seu");
      }
    } else if (!(await memberRepository.find(guildId, targetId))) {
      throw new NotFoundError("Membro não encontrado");
    } else if (targetId !== userId) {
      await accessService.targetRequireAbove(context, guildId, targetId);
    }

    if (!input.allow.length && !input.deny.length) {
      await overwriteRepository.remove(channelId, targetId);
      return null;
    }

    const o = await overwriteRepository.upsert({
      channelId,
      targetId,
      type: input.type,
      allow: input.allow,
      deny: input.deny,
    });

    return { channelId: o.channelId, targetId: o.targetId, type: o.type, allow: o.allow, deny: o.deny };
  },

  async removeOverwrite(userId: string, guildId: string, channelId: string, targetId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_ROLES", channelId);
    await overwriteRepository.remove(channelId, targetId);
  },
};

function normalizeIcon<T extends { iconEmoji?: string | null; iconUrl?: string | null }>(
  input: T,
): T {
  if (input.iconEmoji) return { ...input, iconUrl: null };
  if (input.iconUrl) return { ...input, iconEmoji: null };

  return input;
}
