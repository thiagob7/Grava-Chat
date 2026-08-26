import { highestPosition, type Permission } from "@gravae/shared";
import { AppError, ForbiddenError, NotFoundError } from "~/lib/http.js";
import { toMember, toRole } from "~/lib/serialize.js";
import { memberRepository, channelRepository } from "~/repositories/guild-repository.js";
import { roleRepository, overwriteRepository } from "~/repositories/role-repository.js";
import { accessService, type Contexto } from "./access-service.js";
import type {
  CreateRoleInput,
  ReorderRolesInput,
  SetMemberRolesInput,
  SetOverwriteInput,
  UpdateRoleInput,
} from "~/validations/role.js";

function requireGrantable(contexto: Contexto, permissoes: Permission[]) {
  if (contexto.isOwner || contexto.permissions.has("ADMINISTRATOR")) return;

  const faltando = permissoes.filter((p) => !contexto.permissions.has(p));
  if (faltando.length) {
    throw new ForbiddenError(`Você não pode conceder permissões que não tem: ${faltando.join(", ")}`);
  }
}

async function roleDoGuild(guildId: string, roleId: string) {
  const role = await roleRepository.findById(roleId);
  if (!role || role.guildId !== guildId) throw new NotFoundError("Cargo não encontrado");
  return role;
}

export const roleService = {
  async list(userId: string, guildId: string) {
    await accessService.requireMember(userId, guildId);

    const [roles, contagem] = await Promise.all([
      roleRepository.findManyByGuild(guildId),
      roleRepository.countMembersByRole(guildId),
    ]);

    return roles.map((r) => ({
      ...toRole(r),
      memberCount: r.isEveryone ? undefined : (contagem[r.id] ?? 0),
    }));
  },

  async create(userId: string, guildId: string, input: CreateRoleInput) {
    const contexto = await accessService.requirePermission(userId, guildId, "MANAGE_ROLES");
    const permissions = input.permissions ?? [];
    requireGrantable(contexto, permissions);

    const existentes = await roleRepository.findManyByGuild(guildId);
    if (existentes.length >= 50) throw new AppError("Limite de 50 cargos por servidor");

    await Promise.all(
      existentes
        .filter((r) => !r.isEveryone)
        .map((r) => roleRepository.update(r.id, { position: r.position + 1 })),
    );

    const { iconEmoji, iconUrl } = normalizarIcone(input);

    const role = await roleRepository.create({
      guildId,
      name: input.name,
      color: input.color ?? null,
      colorSecondary: input.colorSecondary ?? null,
      estilo: input.estilo ?? "solido",
      iconEmoji: iconEmoji ?? null,
      iconUrl: iconUrl ?? null,
      position: 1,
      permissions,
      hoist: input.hoist ?? false,
      mentionable: input.mentionable ?? false,
    });

    return toRole(role);
  },

  async update(userId: string, guildId: string, roleId: string, input: UpdateRoleInput) {
    const contexto = await accessService.requirePermission(userId, guildId, "MANAGE_ROLES");
    const role = await roleDoGuild(guildId, roleId);

    accessService.requireAbove(contexto, role.position, "Este cargo está acima do seu");
    if (input.permissions) requireGrantable(contexto, input.permissions);

    const mexeNaAparencia = [
      input.name,
      input.color,
      input.colorSecondary,
      input.estilo,
      input.iconEmoji,
      input.iconUrl,
      input.hoist,
    ].some((v) => v !== undefined);

    if (role.isEveryone && mexeNaAparencia) {
      throw new AppError("O cargo @everyone só aceita mudança de permissões");
    }

    return toRole(await roleRepository.update(roleId, normalizarIcone(input)));
  },

  async remove(userId: string, guildId: string, roleId: string) {
    const contexto = await accessService.requirePermission(userId, guildId, "MANAGE_ROLES");
    const role = await roleDoGuild(guildId, roleId);

    if (role.isEveryone) throw new AppError("O cargo @everyone não pode ser apagado");
    accessService.requireAbove(contexto, role.position, "Este cargo está acima do seu");

    await memberRepository.pullRole(guildId, roleId);
    await roleRepository.remove(roleId);
  },

  async reorder(userId: string, guildId: string, input: ReorderRolesInput) {
    const contexto = await accessService.requirePermission(userId, guildId, "MANAGE_ROLES");
    const atuais = await roleRepository.findManyByGuild(guildId);
    const porId = new Map(atuais.map((r) => [r.id, r]));

    for (const item of input.roles) {
      const role = porId.get(item.id);
      if (!role) throw new NotFoundError("Cargo não encontrado");
      if (role.isEveryone) throw new AppError("O @everyone fica sempre embaixo");

      accessService.requireAbove(contexto, role.position, "Este cargo está acima do seu");
      accessService.requireAbove(contexto, item.position, "Você não pode mover um cargo para cima do seu");
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
    const contexto = await accessService.requirePermission(actorId, guildId, "MANAGE_ROLES");

    const alvo = await memberRepository.find(guildId, targetId);
    if (!alvo) throw new NotFoundError("Membro não encontrado");

    const roles = await roleRepository.findManyByGuild(guildId);
    const porId = new Map(roles.map((r) => [r.id, r]));

    const antes = new Set(alvo.roleIds);
    const depois = new Set(input.roleIds);
    const mudaram = [...new Set([...antes, ...depois])].filter(
      (id) => antes.has(id) !== depois.has(id),
    );

    for (const id of mudaram) {
      const role = porId.get(id);
      if (!role) throw new NotFoundError("Cargo não encontrado");
      if (role.isEveryone) throw new AppError("O @everyone é de todos e não se atribui");
      accessService.requireAbove(contexto, role.position, `Você não pode atribuir "${role.name}"`);
    }

    const atuaisDoAlvo = roles.filter((r) => alvo.roleIds.includes(r.id));
    accessService.requireAbove(
      contexto,
      highestPosition(atuaisDoAlvo),
      "Esta pessoa está acima de você na hierarquia",
    );

    const atualizado = await memberRepository.setRoles(guildId, targetId, [...depois]);
    return toMember(atualizado);
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
    const contexto = await accessService.requirePermission(userId, guildId, "MANAGE_ROLES", channelId);
    requireGrantable(contexto, [...input.allow, ...input.deny]);

    const channel = await channelRepository.findById(channelId);
    if (!channel || channel.guildId !== guildId) throw new NotFoundError("Canal não encontrado");

    if (input.type === "ROLE") {
      const role = await roleDoGuild(guildId, targetId);
      if (!role.isEveryone) {
        accessService.requireAbove(contexto, role.position, "Este cargo está acima do seu");
      }
    } else if (!(await memberRepository.find(guildId, targetId))) {
      throw new NotFoundError("Membro não encontrado");
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

function normalizarIcone<T extends { iconEmoji?: string | null; iconUrl?: string | null }>(
  input: T,
): T {
  if (input.iconEmoji) return { ...input, iconUrl: null };
  if (input.iconUrl) return { ...input, iconEmoji: null };

  return input;
}
