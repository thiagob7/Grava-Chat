import type { SelfUser } from "@gravae/shared";

import { AppError, NotFoundError } from "~/lib/http.js";
import { tagRepository } from "~/repositories/guild-repository.js";
import { noteRepository, userRepository } from "~/repositories/user-repository.js";
import {
  friendshipRepository,
  mutualRepository,
} from "~/repositories/friendship-repository.js";
import { statusVigente, toPublicUser } from "~/lib/serialize.js";
import { presenceService } from "./presence-service.js";

export type ProfileFriendship = "SELF" | "NONE" | "ACCEPTED" | "PENDING_IN" | "PENDING_OUT" | "BLOCKED";

export const profileService = {
  async view(viewerId: string, userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("Usuário não encontrado");

    const relacao =
      viewerId === userId ? null : await friendshipRepository.findBetween(viewerId, userId);

    const guildsEmComum =
      viewerId === userId ? [] : await mutualRepository.guildIdsInCommon(viewerId, userId);

    const podeVer = viewerId === userId || relacao !== null || guildsEmComum.length > 0;
    if (!podeVer) throw new NotFoundError("Usuário não encontrado");

    const escolhida = (user.perfil as { tagGuildId?: string | null } | null)?.tagGuildId ?? null;

    const [presenca, amigosEmComum, nota, etiquetas] = await Promise.all([
      presenceService.mapFor([userId]),
      viewerId === userId ? Promise.resolve(0) : mutualRepository.friendIdsInCommon(viewerId, userId),
      viewerId === userId ? Promise.resolve(null) : noteRepository.find(viewerId, userId),
      tagRepository.resolverMuitas(escolhida ? [escolhida] : []),
    ]);

    const etiquetaDoServidor = escolhida && etiquetas.get(escolhida);

    let friendship: ProfileFriendship = "NONE";
    if (viewerId === userId) friendship = "SELF";
    else if (relacao?.status === "ACCEPTED") friendship = "ACCEPTED";
    else if (relacao?.status === "BLOCKED") friendship = "BLOCKED";
    else if (relacao) friendship = relacao.requesterId === viewerId ? "PENDING_OUT" : "PENDING_IN";

    return {
      ...toPublicUser(user),
      status: presenca[userId] ?? "OFFLINE",
      bio: user.bio,
      perfil: (user.perfil as SelfUser["perfil"]) ?? null,
      etiquetaDoServidor: etiquetaDoServidor
        ? { guildId: escolhida, ...etiquetaDoServidor }
        : null,
      statusPersonalizado: statusVigente(user),
      createdAt: user.createdAt.toISOString(),
      friendship,
      friendshipId: relacao?.id ?? null,
      mutualGuilds: guildsEmComum.length,
      mutualFriends: amigosEmComum,
      nota: nota?.texto ?? null,
    };
  },

  async anotar(viewerId: string, userId: string, texto: string) {
    if (viewerId === userId) throw new AppError("Anotacao e sobre outra pessoa");

    const alvo = await userRepository.findById(userId);
    if (!alvo) throw new NotFoundError("Usuario nao encontrado");

    const nota = await noteRepository.upsert(viewerId, userId, texto);
    return { nota: nota?.texto ?? null };
  },
};
