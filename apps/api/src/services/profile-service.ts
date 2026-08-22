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

    const escolhida = (user.perfil as { tagGuildId?: string | null } | null)?.tagGuildId ?? null;

    const [presenca, amigosEmComum, nota, etiquetas] = await Promise.all([
      presenceService.mapFor([userId]),
      viewerId === userId ? Promise.resolve(0) : mutualRepository.friendIdsInCommon(viewerId, userId),
      // a nota e de QUEM OLHA sobre quem e olhado; nunca o contrario
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
      /**
       * Aqui vai o enfeite COMPLETO — banner, tema e efeito de perfil, que não
       * viajam no mapa `profiles` do servidor.
       *
       * O motivo de mantê-los fora de lá era a repetição: cem pessoas na lista
       * de membros para mostrar o cartão de uma. Neste endpoint é uma pessoa
       * por vez, aberta de propósito por quem clicou, então o cálculo se
       * inverte. É também o que faz o cartão funcionar na DM, onde não existe
       * servidor de onde tirar mapa nenhum.
       */
      perfil: (user.perfil as SelfUser["perfil"]) ?? null,
      /**
       * Resolvida aqui porque quem le nao tem como: e a etiqueta de um servidor
       * que o observador pode nem conhecer. E o que faz ela aparecer tambem na
       * conversa privada, onde nao existe servidor nenhum aberto.
       */
      etiquetaDoServidor: etiquetaDoServidor
        ? { guildId: escolhida, ...etiquetaDoServidor }
        : null,
      statusPersonalizado: statusVigente(user),
      createdAt: user.createdAt.toISOString(),
      friendship,
      friendshipId: relacao?.id ?? null,
      mutualGuilds: guildsEmComum.length,
      mutualFriends: amigosEmComum,
      /**
       * A anotacao privada de quem esta olhando. Sai deste endpoint porque e
       * sobre esta pessoa — mas so chega em quem escreveu, e a pessoa descrita
       * nunca ve nada.
       */
      nota: nota?.texto ?? null,
    };
  },

  /** Grava (ou apaga, se vier vazia) a minha anotacao sobre alguem. */
  async anotar(viewerId: string, userId: string, texto: string) {
    if (viewerId === userId) throw new AppError("Anotacao e sobre outra pessoa");

    const alvo = await userRepository.findById(userId);
    if (!alvo) throw new NotFoundError("Usuario nao encontrado");

    const nota = await noteRepository.upsert(viewerId, userId, texto);
    return { nota: nota?.texto ?? null };
  },
};
