import type { PublicUser } from "@gravae/shared";
import { AppError, NotFoundError } from "~/lib/http.js";
import {
  friendshipRepository,
  dmRepository,
  mutualRepository,
  dmRepositoryRequest,
} from "~/repositories/friendship-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import {
  channelRepository,
  guildRepository,
  memberRepository,
} from "~/repositories/guild-repository.js";
import { voiceService } from "./voice-service.js";
import { toChannel, toPublicUser } from "~/lib/serialize.js";
import { presenceService } from "./presence-service.js";

export type FriendshipView = {
  id: string;
  user: PublicUser;
  status: "ACCEPTED" | "PENDING_IN" | "PENDING_OUT" | "BLOCKED";
  note: string | null;
  createdAt: string;
};

export const friendshipService = {
  async activeNow(userId: string) {
    const [relations, eu] = await Promise.all([
      friendshipRepository.findAllForUser(userId),
      userRepository.findById(userId),
    ]);

    const friends = relations
      .filter((r) => r.status === "ACCEPTED")
      .map((r) => (r.requesterId === userId ? r.addressee : r.requester))
      .filter((friend) => friend.showsActivity);

    const people = eu ? [eu, ...friends] : friends;

    if (!people.length) return [];

    const states = await Promise.all(people.map((a) => voiceService.get(a.id)));

    const inVoice = people
      .map((friend, i) => ({ friend, channelId: states[i]?.channelId ?? null }))
      .filter((x): x is { friend: (typeof people)[number]; channelId: string } => Boolean(x.channelId));

    if (!inVoice.length) return [];

    const [mineServers, channels] = await Promise.all([
      memberRepository.guildIdsOf(userId),
      channelRepository.guildIdsOf(inVoice.map((x) => x.channelId)),
    ]);

    const guildByChannel = new Map(channels.map((c) => [c.id, c.guildId]));
    const mine = new Set(mineServers.map((m) => m.guildId));

    const visible = inVoice.filter((x) => {
      const guildId = guildByChannel.get(x.channelId);
      return guildId && mine.has(guildId);
    });

    if (!visible.length) return [];

    const [channelDetails, servers] = await Promise.all([
      channelRepository.findManyByIds(visible.map((x) => x.channelId)),
      guildRepository.findManyByIds([
        ...new Set(visible.map((x) => guildByChannel.get(x.channelId)!)),
      ]),
    ]);

    const channelById = new Map(channelDetails.map((c) => [c.id, c] as const));
    const serverById = new Map(servers.map((g) => [g.id, g] as const));

    return visible.flatMap((x) => {
      const channel = channelById.get(x.channelId);
      const server = serverById.get(guildByChannel.get(x.channelId)!);
      if (!channel || !server) return [];

      return [
        {
          user: toPublicUser(x.friend),
          channel: { id: channel.id, name: channel.name },
          server: { id: server.id, name: server.name, iconUrl: server.iconUrl },
        },
      ];
    });
  },

  async list(userId: string): Promise<FriendshipView[]> {
    const all = await friendshipRepository.findAllForUser(userId);
    const relations = all.filter(
      (r) => r.status !== "BLOCKED" || r.requesterId === userId,
    );

    const others = relations.map((r) => (r.requesterId === userId ? r.addressee : r.requester));
    const presence = await presenceService.mapFor(others.map((u) => u.id));

    return relations.map((relation) => {
      const euRequested = relation.requesterId === userId;
      const other = euRequested ? relation.addressee : relation.requester;

      return {
        id: relation.id,
        user: { ...toPublicUser(other), status: presence[other.id] ?? "OFFLINE" },
        status:
          relation.status === "PENDING" ? (euRequested ? "PENDING_OUT" : "PENDING_IN") : relation.status,
        note: relation.status === "PENDING" ? (relation.note ?? null) : null,
        createdAt: relation.createdAt.toISOString(),
      };
    });
  },

  async block(userId: string, targetId: string) {
    if (targetId === userId) throw new AppError("Você não pode bloquear a si mesmo");

    const target = await userRepository.findById(targetId);
    if (!target) throw new NotFoundError("Usuário não encontrado");

    const existing = await friendshipRepository.findBetween(userId, targetId);

    if (existing) await friendshipRepository.remove(existing.id);

    await friendshipRepository.createBlocked(userId, targetId);
  },

  async unblock(userId: string, targetId: string) {
    const relation = await friendshipRepository.findBetween(userId, targetId);

    if (!relation || relation.status !== "BLOCKED") throw new AppError("Essa pessoa não está bloqueada");
    if (relation.requesterId !== userId) throw new AppError("Quem bloqueou foi a outra pessoa");

    await friendshipRepository.remove(relation.id);
  },

  async request(userId: string, username: string, note?: string | null) {
    const target = await userRepository.findByUsernamePublic(username.replace(/^@/, "").trim());
    if (!target) throw new NotFoundError("Não achei ninguém com esse nome de usuário");
    if (target.id === userId) throw new AppError("Você não pode adicionar a si mesmo");

    if (!target.acceptedRequests) throw new AppError("Não foi possível enviar o pedido");

    const existing = await friendshipRepository.findBetween(userId, target.id);

    if (existing) {
      if (existing.status === "ACCEPTED") throw new AppError("Vocês já são amigos");
      if (existing.status === "BLOCKED") throw new AppError("Não foi possível enviar o pedido");

      if (existing.addresseeId === userId) {
        return { relation: await friendshipRepository.updateStatus(existing.id, "ACCEPTED"), accepted: true };
      }

      throw new AppError("Você já enviou um pedido para essa pessoa");
    }

    return {
      relation: await friendshipRepository.create(userId, target.id, note?.trim() || null),
      accepted: false,
    };
  },

  async respond(userId: string, friendshipId: string, accept: boolean) {
    const relation = await friendshipRepository.findById(friendshipId);
    if (!relation) throw new NotFoundError("Pedido não encontrado");

    if (relation.addresseeId !== userId) throw new AppError("Este pedido não é seu");
    if (relation.status !== "PENDING") throw new AppError("Este pedido já foi respondido");

    if (!accept) {
      await friendshipRepository.remove(relation.id);
      return null;
    }

    return friendshipRepository.updateStatus(relation.id, "ACCEPTED");
  },

  async remove(userId: string, friendshipId: string) {
    const relation = await friendshipRepository.findById(friendshipId);
    if (!relation) throw new NotFoundError("Não encontrado");

    if (relation.requesterId !== userId && relation.addresseeId !== userId) {
      throw new AppError("Esta relação não é sua");
    }

    await friendshipRepository.remove(relation.id);
  },

  async openDm(userId: string, otherId: string) {
    const relation = await friendshipRepository.findBetween(userId, otherId);

    if (relation?.status === "BLOCKED") throw new AppError("Não foi possível abrir a conversa");

    const other = await userRepository.findById(otherId);
    if (!other) throw new NotFoundError("Pessoa não encontrada");

    const directWithoutFriendship = Boolean(other.system || other.isBot);
    const areFriends = relation?.status === "ACCEPTED";

    const existing = await dmRepository.findBetween(userId, otherId);

    if (directWithoutFriendship || areFriends) {
      if (existing) return { channel: toChannel(existing), request: false };
      return { channel: toChannel(await dmRepository.create([userId, otherId])), request: false };
    }

    if (existing) {
      const request = await dmRepositoryRequest.findByChannel(existing.id);
      if (!request || request.status === "ACCEPTED") return { channel: toChannel(existing), request: false };

      return { channel: toChannel(existing), request: true };
    }

    if (!other.membersAllowDm) throw notDelivered();

    const inCommon = await mutualRepository.guildIdsInCommon(userId, otherId);
    if (!inCommon.length) throw notDelivered();

    const channel = await dmRepository.create([userId, otherId]);
    const suspect = await isSuspect(other, userId);
    await dmRepositoryRequest.create(channel.id, userId, otherId, suspect);

    return { channel: toChannel(channel), request: true };
  },

  async listRequests(userId: string) {
    const requests = await dmRepositoryRequest.pendingFor(userId);
    if (!requests.length) return { requests: [], spam: [] };

    const [previews, ...inCommon] = await Promise.all([
      dmRepositoryRequest.previews(requests.map((p) => p.channelId)),
      ...requests.map((p) => mutualRepository.guildIdsInCommon(userId, p.fromId)),
    ]);

    const list = requests.map((request, i) => ({
      channelId: request.channelId,
      de: toPublicUser(request.from),
      spam: request.spam,
      serversCommon: inCommon[i]?.length ?? 0,
      createdAt: request.createdAt.toISOString(),
      preview: previews.get(request.channelId) ?? null,
    }));

    return {
      requests: list.filter((p) => !p.spam),
      spam: list.filter((p) => p.spam),
    };
  },

  async replyRequest(userId: string, channelId: string, action: "aceitar" | "ignorar" | "spam") {
    const request = await dmRepositoryRequest.findByChannel(channelId);

    if (!request || request.toId !== userId || request.status !== "PENDING") {
      throw new NotFoundError("Pedido não encontrado");
    }

    if (action === "aceitar") {
      await dmRepositoryRequest.accept(channelId);
      return { accepted: true };
    }

    await dmRepositoryRequest.ignore(channelId, action === "spam");
    return { accepted: false };
  },

  async listDms(userId: string) {

    const channels = await dmRepository.findManyForUser(userId);
    if (!channels.length) return [];

    const requests = await dmRepositoryRequest.byChannel(channels.map((c) => c.id));
    const visible = channels.filter((channel) => {
      const request = requests.get(channel.id);
      return !request || request.status === "ACCEPTED" || request.toId !== userId;
    });

    if (!visible.length) return [];

    const othersIds = visible.map((c) => c.recipients.find((r) => r !== userId)!).filter(Boolean);
    const [users, presence, latest] = await Promise.all([
      userRepository.findManyByIds(othersIds),
      presenceService.mapFor(othersIds),
      channelRepository.lastMessageIdByChannel(visible.map((c) => c.id)),
    ]);

    const byId = new Map(users.map((u) => [u.id, u]));

    return visible.flatMap((channel) => {
      const otherId = channel.recipients.find((r) => r !== userId);
      const other = otherId ? byId.get(otherId) : undefined;
      if (!other) return [];

      return [
        {
          ...toChannel(channel),
          lastMessageId: latest.get(channel.id) ?? null,
          user: { ...toPublicUser(other), status: presence[other.id] ?? "OFFLINE" },
        },
      ];
    });
  },
};

function notDelivered() {
  return new AppError(
    "Sua mensagem não pôde ser entregue. Isso costuma acontecer porque vocês não compartilham nenhuma comunidade, ou porque essa pessoa só recebe mensagens de amigos.",
  ).having("nao-entregue");
}

async function isSuspect(destination: { id: string; spamFilter: string }, senderId: string) {
  if (destination.spamFilter === "NENHUM") return false;
  if (destination.spamFilter === "TODOS") return true;

  const friendsCommon = await mutualRepository.friendIdsInCommon(destination.id, senderId);
  return friendsCommon.length === 0;
}
