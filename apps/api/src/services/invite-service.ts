import { AppError, NotFoundError } from "~/lib/http.js";
import { inviteRepository } from "~/repositories/invite-repository.js";
import { memberRepository } from "~/repositories/guild-repository.js";
import { banRepository } from "~/repositories/ban-repository.js";
import { toMember } from "~/lib/serialize.js";
import { presenceService } from "~/services/presence-service.js";

export const inviteService = {
  async preview(userId: string, code: string) {
    const invite = await inviteRepository.findByCodeWithRelations(code);
    if (!invite) throw new NotFoundError("Convite inválido ou expirado");

    /*
      O cartão que aparece no chat mostra quantos estão online agora — é o que
      diz se a comunidade está viva. Por isso a presença sai daqui, e não de uma
      segunda chamada.
    */
    const membros = await memberRepository.findManyByGuild(invite.guildId);
    const presenca = await presenceService.mapFor(membros.map((m) => m.userId));

    return {
      code: invite.code,
      guild: {
        id: invite.guild.id,
        name: invite.guild.name,
        iconUrl: invite.guild.iconUrl,
        bannerUrl: invite.guild.bannerUrl,
        description: invite.guild.description,
        memberCount: invite.guild._count.members,
        onlineCount: Object.values(presenca).filter((estado) => estado !== "OFFLINE").length,
      },
      inviter: invite.inviter.displayName,
      alreadyMember: Boolean(await memberRepository.find(invite.guildId, userId)),
    };
  },

  async accept(userId: string, code: string) {
    const invite = await inviteRepository.findByCode(code);
    if (!invite) throw new NotFoundError("Convite inválido");

    if (invite.expiresAt && invite.expiresAt < new Date()) throw new AppError("Convite expirado", 410);
    if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
      throw new AppError("Convite esgotado", 410);
    }

    if (await banRepository.find(invite.guildId, userId)) {
      throw new AppError("Você está banido deste servidor", 403);
    }

    const existing = await memberRepository.find(invite.guildId, userId);
    if (existing) return { guildId: invite.guildId, alreadyMember: true as const, member: null };

    const member = await memberRepository.create({
      guildId: invite.guildId,
      userId,
      inviteCode: invite.code,
      invitedById: invite.inviterId,
    });
    await inviteRepository.incrementUses(invite.id);

    return { guildId: invite.guildId, alreadyMember: false as const, member: toMember(member) };
  },
};
