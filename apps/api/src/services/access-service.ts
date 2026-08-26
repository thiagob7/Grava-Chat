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
import { dmRepository } from "~/repositories/friendship-repository.js";
import { roleRepository, overwriteRepository } from "~/repositories/role-repository.js";

export interface Contexto {
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

  async requireChannelAccess(userId: string, channelId: string) {
    const channel = await channelRepository.findById(channelId);
    if (!channel) throw new NotFoundError("Canal não encontrado");

    if (channel.guildId === null) {
      if (!channel.recipients.includes(userId)) throw new NotFoundError("Canal não encontrado");
      return { channel, contexto: null };
    }

    const contexto = await accessService.contextOf(userId, channel.guildId, channelId);

    if (!has(contexto.permissions, "VIEW_CHANNEL")) throw new NotFoundError("Canal não encontrado");

    return { channel, contexto };
  },

  /**
   * Os canais do servidor onde esta pessoa pode ler.
   *
   * A busca precisa disso antes de qualquer consulta: procurar em todos os
   * canais e filtrar o resultado depois vazaria por outro caminho — o número
   * de acertos já conta que existe conversa no canal fechado. Aqui a lista de
   * canais entra na consulta, não sai dela.
   *
   * `READ_MESSAGE_HISTORY` junto de `VIEW_CHANNEL` porque é o histórico que
   * está sendo vasculhado: quem só pode ver o canal daqui pra frente não pode
   * achar o que foi dito antes.
   */
  async readableChannels(
    userId: string,
    guildId: string,
    { comHistorico = true } = {},
  ): Promise<string[]> {
    const [member, guild] = await Promise.all([
      accessService.requireMember(userId, guildId),
      guildRepository.findById(guildId),
    ]);

    if (!guild) throw new NotFoundError("Servidor não encontrado");

    const isOwner = guild.ownerId === userId;
    const roles = await roleRepository.findForMember(guildId, member.roleIds);
    const canais = await channelRepository.findManyByGuild(guildId);
    const overwrites = await overwriteRepository.findManyByChannels(canais.map((c) => c.id));

    const porCanal = new Map<string, typeof overwrites>();
    for (const o of overwrites) porCanal.set(o.channelId, [...(porCanal.get(o.channelId) ?? []), o]);

    return canais
      .filter((canal) => {
        const permissoes = computePermissions({
          userId,
          isOwner,
          roles,
          overwrites: porCanal.get(canal.id) ?? [],
        });

        if (!has(permissoes, "VIEW_CHANNEL")) return false;
        return !comHistorico || has(permissoes, "READ_MESSAGE_HISTORY");
      })
      .map((canal) => canal.id);
  },

  /**
   * Tudo o que esta pessoa deve OUVIR — servidores e conversas privadas.
   *
   * Antes, o app só entrava na sala do canal que estava aberto. Funcionava
   * para o chat e escondia um buraco: mensagem de qualquer outro canal
   * simplesmente não chegava no navegador. Nada de contador crescendo, nada
   * de aviso — a menção de um canal fechado só aparecia quando você abrisse
   * aquele canal, que é justamente quando o aviso não serve mais para nada.
   *
   * Aqui é `VIEW_CHANNEL` só: receber o que está sendo dito agora não é ler
   * o que foi dito antes.
   */
  async listenableChannels(userId: string, guildIds: string[]): Promise<string[]> {
    const porServidor = await Promise.all(
      guildIds.map((guildId) =>
        accessService
          .readableChannels(userId, guildId, { comHistorico: false })
          .catch(() => [] as string[]),
      ),
    );

    const dms = await dmRepository.findManyForUser(userId);

    return [...porServidor.flat(), ...dms.map((c) => c.id)];
  },

  requireAbove(contexto: Contexto, posicaoAlvo: number, mensagem: string) {
    if (contexto.isOwner) return;
    if (contexto.highest <= posicaoAlvo) throw new ForbiddenError(mensagem);
  },
};
