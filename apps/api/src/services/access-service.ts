import {
  computePermissions,
  has,
  highestPosition,
  type Permission,
  type RoleLike,
} from "@gravae/shared";
import { AppError, NotFoundError, ForbiddenError } from "~/lib/http.js";
import { memberRepository, channelRepository, guildRepository } from "~/repositories/guild-repository.js";
import { banRepository } from "~/repositories/ban-repository.js";
import { dmRepository } from "~/repositories/friendship-repository.js";
import { roleRepository, overwriteRepository } from "~/repositories/role-repository.js";

export interface Context {
  member: Awaited<ReturnType<typeof memberRepository.find>>;
  roles: RoleLike[];
  isOwner: boolean;
  permissions: Set<Permission>;
  highest: number;
}

export const accessService = {
  async requireMember(userId: string, guildId: string) {
    const member = await memberRepository.find(guildId, userId);

    if (!member) throw new NotFoundError("Você não é membro deste servidor");

    if (await banRepository.find(guildId, userId)) {
      throw new NotFoundError("Você não é membro deste servidor");
    }

    return member;
  },

  async contextOf(userId: string, guildId: string, channelId?: string): Promise<Context> {
    const [member, guild] = await Promise.all([
      accessService.requireMember(userId, guildId),
      guildRepository.findById(guildId),
    ]);

    if (!guild) throw new NotFoundError("Servidor não encontrado");

    const roles = await roleRepository.findForMember(guildId, member.roleIds);
    const overwrites = channelId ? await overwriteRepository.findManyByChannel(channelId) : undefined;
    const isOwner = guild.ownerId === userId;

    return {
      member,
      roles,
      isOwner,
      permissions: computePermissions({ userId, isOwner, roles, overwrites }),
      highest: isOwner ? Number.POSITIVE_INFINITY : highestPosition(roles),
    };
  },

  async requirePermission(
    userId: string,
    guildId: string,
    permission: Permission,
    channelId?: string,
  ) {
    const context = await accessService.contextOf(userId, guildId, channelId);

    if (!has(context.permissions, permission)) {
      throw new ForbiddenError("Você não tem permissão para isso");
    }

    return context;
  },

  async requireChannelAccess(userId: string, channelId: string) {
    const channel = await channelRepository.findById(channelId);
    if (!channel) throw new NotFoundError("Canal não encontrado").having("sem-acesso");

    if (channel.guildId === null) {
      if (!channel.recipients.includes(userId)) throw new NotFoundError("Canal não encontrado").having("sem-acesso");
      return { channel, context: null };
    }

    const context = await accessService.contextOf(userId, channel.guildId, channelId);

    if (!has(context.permissions, "VIEW_CHANNEL")) throw new NotFoundError("Canal não encontrado").having("sem-acesso");

    return { channel, context };
  },

  async readableChannels(
    userId: string,
    guildId: string,
    { withHistory = true } = {},
  ): Promise<string[]> {
    const [member, guild] = await Promise.all([
      accessService.requireMember(userId, guildId),
      guildRepository.findById(guildId),
    ]);

    if (!guild) throw new NotFoundError("Servidor não encontrado");

    const isOwner = guild.ownerId === userId;
    const roles = await roleRepository.findForMember(guildId, member.roleIds);
    const channels = await channelRepository.findManyByGuild(guildId);
    const overwrites = await overwriteRepository.findManyByChannels(channels.map((c) => c.id));

    const byChannel = new Map<string, typeof overwrites>();
    for (const o of overwrites) byChannel.set(o.channelId, [...(byChannel.get(o.channelId) ?? []), o]);

    return channels
      .filter((channel) => {
        const permissions = computePermissions({
          userId,
          isOwner,
          roles,
          overwrites: byChannel.get(channel.id) ?? [],
        });

        if (!has(permissions, "VIEW_CHANNEL")) return false;
        return !withHistory || has(permissions, "READ_MESSAGE_HISTORY");
      })
      .map((channel) => channel.id);
  },

  async listenableChannels(userId: string, guildIds: string[]): Promise<string[]> {
    const byServer = await Promise.all(
      guildIds.map((guildId) =>
        accessService
          .readableChannels(userId, guildId, { withHistory: false })
          .catch(() => [] as string[]),
      ),
    );

    const dms = await dmRepository.findManyForUser(userId);

    return [...byServer.flat(), ...dms.map((c) => c.id)];
  },

  requireAbove(context: Context, positionTarget: number, message: string) {
    if (context.isOwner) return;
    if (context.highest <= positionTarget) throw new ForbiddenError(message);
  },

  async targetRequireAbove(context: Context, guildId: string, targetId: string) {
    const guild = await guildRepository.findById(guildId);
    if (!guild) throw new NotFoundError("Servidor não encontrado");
    if (guild.ownerId === targetId) {
      throw new AppError("O dono do servidor não pode ser moderado", 403);
    }

    const target = await memberRepository.find(guildId, targetId);
    if (!target) return;

    const roles = await roleRepository.findForMember(guildId, target.roleIds);

    accessService.requireAbove(
      context,
      highestPosition(roles),
      "Esta pessoa está acima de você na hierarquia",
    );
  },
};
