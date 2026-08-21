import { AppError, NotFoundError } from "~/lib/http.js";
import { inviteRepository } from "~/repositories/invite-repository.js";
import { memberRepository } from "~/repositories/guild-repository.js";
import { banRepository } from "~/repositories/ban-repository.js";
import { toMember } from "~/lib/serialize.js";

export const inviteService = {
  /** Preview público: quem recebeu o link vê onde está entrando antes de aceitar. */
  async preview(userId: string, code: string) {
    const invite = await inviteRepository.findByCodeWithRelations(code);
    if (!invite) throw new NotFoundError("Convite inválido ou expirado");

    return {
      code: invite.code,
      guild: {
        id: invite.guild.id,
        name: invite.guild.name,
        iconUrl: invite.guild.iconUrl,
        memberCount: invite.guild._count.members,
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

    // banido não volta nem com convite novo — é isso que separa banir de expulsar
    if (await banRepository.find(invite.guildId, userId)) {
      throw new AppError("Você está banido deste servidor", 403);
    }

    const existing = await memberRepository.find(invite.guildId, userId);
    if (existing) return { guildId: invite.guildId, alreadyMember: true as const, member: null };

    // entra só com o @everyone, que é implícito
    const member = await memberRepository.create({ guildId: invite.guildId, userId });
    await inviteRepository.incrementUses(invite.id);

    return { guildId: invite.guildId, alreadyMember: false as const, member: toMember(member) };
  },
};
