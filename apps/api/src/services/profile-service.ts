import type { SelfUser } from "@gravae/shared";

import { AppError, NotFoundError } from "~/lib/http.js";
import { guildRepository, tagRepository } from "~/repositories/guild-repository.js";
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
      viewerId === userId
        ? Promise.resolve([] as string[])
        : mutualRepository.friendIdsInCommon(viewerId, userId),
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
      mutualFriends: amigosEmComum.length,
      nota: nota?.texto ?? null,
    };
  },

  /**
   * Quem e o que os dois têm em comum — as listas, não só a contagem.
   *
   * Rota separada da do perfil de propósito: o cartão abre com a contagem, que
   * já vem do `view`, e só vai atrás dos nomes e dos ícones quando a pessoa
   * clica na aba. Carregar tudo junto seria pagar duas buscas a mais em toda
   * abertura de perfil pra mostrar algo que quase ninguém abre.
   *
   * Vale a mesma regra de visibilidade do perfil: sem amizade e sem servidor
   * em comum, o usuário "não existe" pra quem está olhando.
   */
  async emComum(viewerId: string, userId: string) {
    if (viewerId === userId) return { amigos: [], servidores: [] };

    const [relacao, guildIds] = await Promise.all([
      friendshipRepository.findBetween(viewerId, userId),
      mutualRepository.guildIdsInCommon(viewerId, userId),
    ]);

    if (relacao === null && guildIds.length === 0) throw new NotFoundError("Usuário não encontrado");

    /*
      O dono do perfil decide o que a aba mostra.

      A checagem é aqui, e não na tela: se o servidor devolvesse a lista e
      pedisse pro cliente não desenhar, quem olhasse a resposta da rede veria
      tudo — que é o mesmo que não esconder nada. Já foi assim com o bloqueio,
      e o remendo é o mesmo: quem esconde, esconde no servidor.

      As duas listas são perguntas diferentes. A de servidores desenha a
      rotina de alguém; a de amigos, a rede. Quem fecha uma raramente quer
      fechar a outra, então são dois interruptores e não um.
    */
    const dono = await userRepository.findById(userId);

    const amigoIds = dono?.mostraAmigosEmComum
      ? await mutualRepository.friendIdsInCommon(viewerId, userId)
      : [];

    const idsDeServidores = dono?.mostraServidoresEmComum ? guildIds : [];

    const [amigos, servidores, presenca] = await Promise.all([
      userRepository.findManyByIds(amigoIds),
      guildRepository.findManyByIds(idsDeServidores),
      presenceService.mapFor(amigoIds),
    ]);

    return {
      amigos: amigos.map((amigo) => ({
        ...toPublicUser(amigo),
        status: presenca[amigo.id] ?? "OFFLINE",
      })),
      servidores: servidores.map((guild) => ({
        id: guild.id,
        name: guild.name,
        iconUrl: guild.iconUrl,
      })),
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
