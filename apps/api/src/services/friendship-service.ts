import type { PublicUser } from "@gravae/shared";
import { AppError, NotFoundError } from "~/lib/http.js";
import { friendshipRepository, dmRepository } from "~/repositories/friendship-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { channelRepository } from "~/repositories/guild-repository.js";
import { toChannel, toPublicUser } from "~/lib/serialize.js";
import { presenceService } from "./presence-service.js";

export type FriendshipView = {
  id: string;
  user: PublicUser;
  /** ACCEPTED = amigos; PENDING_IN = ele te chamou; PENDING_OUT = você chamou */
  status: "ACCEPTED" | "PENDING_IN" | "PENDING_OUT" | "BLOCKED";
  createdAt: string;
};

export const friendshipService = {
  /**
   * Lista tudo de uma vez, já do ponto de vista de quem perguntou: quem pediu e
   * quem recebeu vira "entrada" ou "saída", que é o que a tela precisa saber.
   */
  async list(userId: string): Promise<FriendshipView[]> {
    const relacoes = await friendshipRepository.findAllForUser(userId);
    const outros = relacoes.map((r) => (r.requesterId === userId ? r.addressee : r.requester));
    const presenca = await presenceService.mapFor(outros.map((u) => u.id));

    return relacoes.map((relacao) => {
      const euPedi = relacao.requesterId === userId;
      const outro = euPedi ? relacao.addressee : relacao.requester;

      return {
        id: relacao.id,
        user: { ...toPublicUser(outro), status: presenca[outro.id] ?? "OFFLINE" },
        status:
          relacao.status === "PENDING" ? (euPedi ? "PENDING_OUT" : "PENDING_IN") : relacao.status,
        createdAt: relacao.createdAt.toISOString(),
      };
    });
  },

  /** Pedido de amizade por nome de usuário, como no Discord. */
  async request(userId: string, username: string) {
    const alvo = await userRepository.findByUsernamePublic(username.replace(/^@/, "").trim());
    if (!alvo) throw new NotFoundError("Não achei ninguém com esse nome de usuário");
    if (alvo.id === userId) throw new AppError("Você não pode adicionar a si mesmo");

    const existente = await friendshipRepository.findBetween(userId, alvo.id);

    if (existente) {
      if (existente.status === "ACCEPTED") throw new AppError("Vocês já são amigos");
      if (existente.status === "BLOCKED") throw new AppError("Não foi possível enviar o pedido");

      /**
       * Ele já tinha te chamado e você "pediu" de volta: isso é aceitar. Sem
       * este caso, os dois ficariam presos com um pedido pendente cada um.
       */
      if (existente.addresseeId === userId) {
        return { relacao: await friendshipRepository.updateStatus(existente.id, "ACCEPTED"), aceitou: true };
      }

      throw new AppError("Você já enviou um pedido para essa pessoa");
    }

    return { relacao: await friendshipRepository.create(userId, alvo.id), aceitou: false };
  },

  async respond(userId: string, friendshipId: string, aceitar: boolean) {
    const relacao = await friendshipRepository.findById(friendshipId);
    if (!relacao) throw new NotFoundError("Pedido não encontrado");

    // Só quem RECEBEU pode aceitar; quem enviou só pode cancelar.
    if (relacao.addresseeId !== userId) throw new AppError("Este pedido não é seu");
    if (relacao.status !== "PENDING") throw new AppError("Este pedido já foi respondido");

    if (!aceitar) {
      await friendshipRepository.remove(relacao.id);
      return null;
    }

    return friendshipRepository.updateStatus(relacao.id, "ACCEPTED");
  },

  /** Serve para cancelar pedido enviado e para desfazer amizade. */
  async remove(userId: string, friendshipId: string) {
    const relacao = await friendshipRepository.findById(friendshipId);
    if (!relacao) throw new NotFoundError("Não encontrado");

    if (relacao.requesterId !== userId && relacao.addresseeId !== userId) {
      throw new AppError("Esta relação não é sua");
    }

    await friendshipRepository.remove(relacao.id);
  },

  /**
   * Abre (ou cria) a conversa privada. Exige amizade: sem isso, qualquer pessoa
   * com um id de usuário poderia abrir uma DM e mandar mensagem.
   */
  async openDm(userId: string, outroId: string) {
    const relacao = await friendshipRepository.findBetween(userId, outroId);
    if (!relacao || relacao.status !== "ACCEPTED") {
      throw new AppError("Vocês precisam ser amigos para conversar");
    }

    const existente = await dmRepository.findBetween(userId, outroId);
    if (existente) return toChannel(existente);

    return toChannel(await dmRepository.create([userId, outroId]));
  },

  /** Conversas privadas do usuário, com a outra pessoa e a última mensagem. */
  async listDms(userId: string) {
    const canais = await dmRepository.findManyForUser(userId);
    if (!canais.length) return [];

    const outrosIds = canais.map((c) => c.recipients.find((r) => r !== userId)!).filter(Boolean);
    const [usuarios, presenca, ultimas] = await Promise.all([
      userRepository.findManyByIds(outrosIds),
      presenceService.mapFor(outrosIds),
      channelRepository.lastMessageIdByChannel(canais.map((c) => c.id)),
    ]);

    const porId = new Map(usuarios.map((u) => [u.id, u]));

    return canais.flatMap((canal) => {
      const outroId = canal.recipients.find((r) => r !== userId);
      const outro = outroId ? porId.get(outroId) : undefined;
      if (!outro) return [];

      return [
        {
          ...toChannel(canal),
          lastMessageId: ultimas.get(canal.id) ?? null,
          user: { ...toPublicUser(outro), status: presenca[outro.id] ?? "OFFLINE" },
        },
      ];
    });
  },
};
