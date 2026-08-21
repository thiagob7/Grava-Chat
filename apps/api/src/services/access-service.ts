import {
  computePermissions,
  has,
  highestPosition,
  type Permission,
  type RoleLike,
} from "@gravae/shared";
import { NotFoundError, ForbiddenError } from "~/lib/http.js";
import { memberRepository, channelRepository, guildRepository } from "~/repositories/guild-repository.js";
import { banRepository } from "~/repositories/ban-repository.js";
import { roleRepository, overwriteRepository } from "~/repositories/role-repository.js";

export interface Contexto {
  member: Awaited<ReturnType<typeof memberRepository.find>>;
  roles: RoleLike[];
  isOwner: boolean;
  permissions: Set<Permission>;
  /** posição do cargo mais alto — limita o que se pode fazer com cargos e pessoas */
  highest: number;
}

/**
 * Toda checagem de permissão passa por aqui. Centralizado de propósito: com a
 * regra espalhada, uma rota nova esquece de checar e vira buraco de acesso.
 */
export const accessService = {
  async requireMember(userId: string, guildId: string) {
    const member = await memberRepository.find(guildId, userId);

    // 404 e não 403: um não-membro não deve nem descobrir que o servidor existe.
    if (!member) throw new NotFoundError("Você não é membro deste servidor");

    /**
     * Banido some do servidor na hora, mesmo com a tela aberta. A remoção do
     * membro já acontece no banimento; esta checagem cobre a corrida entre
     * banir e a próxima requisição de quem estava dentro.
     */
    if (await banRepository.find(guildId, userId)) {
      throw new NotFoundError("Você não é membro deste servidor");
    }

    return member;
  },

  /**
   * Contexto de permissões no servidor, ou dentro de um canal se `channelId`
   * for passado (aí os overwrites entram no cálculo).
   */
  async contextOf(userId: string, guildId: string, channelId?: string): Promise<Contexto> {
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
    const contexto = await accessService.contextOf(userId, guildId, channelId);

    if (!has(contexto.permissions, permission)) {
      throw new ForbiddenError("Você não tem permissão para isso");
    }

    return contexto;
  },

  /**
   * Resolve o canal e confirma o acesso. Serve para canal de servidor e para DM
   * (que não tem guildId — a checagem ali é a lista de destinatários).
   *
   * Num canal de servidor, exige VIEW_CHANNEL: é isso que faz um canal
   * restrito simplesmente não existir para quem não pode vê-lo.
   */
  async requireChannelAccess(userId: string, channelId: string) {
    const channel = await channelRepository.findById(channelId);
    if (!channel) throw new NotFoundError("Canal não encontrado");

    if (channel.guildId === null) {
      if (!channel.recipients.includes(userId)) throw new NotFoundError("Canal não encontrado");
      return { channel, contexto: null };
    }

    const contexto = await accessService.contextOf(userId, channel.guildId, channelId);

    // 404 outra vez: dizer "sem permissão" já entrega que o canal existe.
    if (!has(contexto.permissions, "VIEW_CHANNEL")) throw new NotFoundError("Canal não encontrado");

    return { channel, contexto };
  },

  /**
   * Ninguém mexe em cargo igual ou acima do próprio, nem em quem está acima.
   * Sem isso, qualquer um com MANAGE_ROLES se promove a administrador.
   */
  requireAbove(contexto: Contexto, posicaoAlvo: number, mensagem: string) {
    if (contexto.isOwner) return;
    if (contexto.highest <= posicaoAlvo) throw new ForbiddenError(mensagem);
  },
};
