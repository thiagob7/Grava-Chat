import { NotFoundError } from "~/lib/http.js";
import { userRepository } from "~/repositories/user-repository.js";
import {
  friendshipRepository,
  mutualRepository,
} from "~/repositories/friendship-repository.js";
import { toPublicUser } from "~/lib/serialize.js";
import { presenceService } from "./presence-service.js";

export type ProfileFriendship = "SELF" | "NONE" | "ACCEPTED" | "PENDING_IN" | "PENDING_OUT" | "BLOCKED";

export const profileService = {
  /**
   * Perfil público de outra pessoa.
   *
   * Só é visível para quem compartilha um servidor ou já é amigo — sem essa
   * regra, qualquer id de usuário viraria uma consulta livre de perfis, e o
   * app é um espaço fechado entre amigos, não um diretório.
   */
  async view(viewerId: string, userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("Usuário não encontrado");

    const relacao =
      viewerId === userId ? null : await friendshipRepository.findBetween(viewerId, userId);

    const guildsEmComum =
      viewerId === userId ? [] : await mutualRepository.guildIdsInCommon(viewerId, userId);

    const podeVer = viewerId === userId || relacao !== null || guildsEmComum.length > 0;
    // 404 e não 403: não confirma sequer que a conta existe para um estranho
    if (!podeVer) throw new NotFoundError("Usuário não encontrado");

    const [presenca, amigosEmComum] = await Promise.all([
      presenceService.mapFor([userId]),
      viewerId === userId ? Promise.resolve(0) : mutualRepository.friendIdsInCommon(viewerId, userId),
    ]);

    let friendship: ProfileFriendship = "NONE";
    if (viewerId === userId) friendship = "SELF";
    else if (relacao?.status === "ACCEPTED") friendship = "ACCEPTED";
    else if (relacao?.status === "BLOCKED") friendship = "BLOCKED";
    else if (relacao) friendship = relacao.requesterId === viewerId ? "PENDING_OUT" : "PENDING_IN";

    return {
      ...toPublicUser(user),
      status: presenca[userId] ?? "OFFLINE",
      bio: user.bio,
      createdAt: user.createdAt.toISOString(),
      friendship,
      friendshipId: relacao?.id ?? null,
      mutualGuilds: guildsEmComum.length,
      mutualFriends: amigosEmComum,
    };
  },
};
