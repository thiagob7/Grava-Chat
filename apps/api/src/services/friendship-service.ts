import type { PublicUser } from "@gravae/shared";
import { AppError, NotFoundError } from "~/lib/http.js";
import { friendshipRepository, dmRepository } from "~/repositories/friendship-repository.js";
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
  createdAt: string;
};

export const friendshipService = {
  /*
    "Ativo agora": amigos que estão num canal de voz de um servidor que EU
    também tenho. O filtro por servidor em comum não é detalhe de produto — sem
    ele, eu veria onde meu amigo está em servidores que não são meus, o que é
    vazar a rotina dele pra fora do lugar onde ele decidiu estar comigo.
  */
  async ativosAgora(userId: string) {
    const relacoes = await friendshipRepository.findAllForUser(userId);
    const amigos = relacoes
      .filter((r) => r.status === "ACCEPTED")
      .map((r) => (r.requesterId === userId ? r.addressee : r.requester));

    if (!amigos.length) return [];

    const estados = await Promise.all(amigos.map((a) => voiceService.get(a.id)));

    const emVoz = amigos
      .map((amigo, i) => ({ amigo, canalId: estados[i]?.channelId ?? null }))
      .filter((x): x is { amigo: (typeof amigos)[number]; canalId: string } => Boolean(x.canalId));

    if (!emVoz.length) return [];

    const [meusServidores, canais] = await Promise.all([
      memberRepository.guildIdsOf(userId),
      channelRepository.guildIdsOf(emVoz.map((x) => x.canalId)),
    ]);

    const guildPorCanal = new Map(canais.map((c) => [c.id, c.guildId]));
    const meus = new Set(meusServidores.map((m) => m.guildId));

    const visiveis = emVoz.filter((x) => {
      const guildId = guildPorCanal.get(x.canalId);
      return guildId && meus.has(guildId);
    });

    if (!visiveis.length) return [];

    const [detalhesDeCanal, servidores] = await Promise.all([
      channelRepository.findManyByIds(visiveis.map((x) => x.canalId)),
      guildRepository.findManyByIds([
        ...new Set(visiveis.map((x) => guildPorCanal.get(x.canalId)!)),
      ]),
    ]);

    const canalPorId = new Map(detalhesDeCanal.map((c) => [c.id, c] as const));
    const servidorPorId = new Map(servidores.map((g) => [g.id, g] as const));

    return visiveis.flatMap((x) => {
      const canal = canalPorId.get(x.canalId);
      const servidor = servidorPorId.get(guildPorCanal.get(x.canalId)!);
      if (!canal || !servidor) return [];

      return [
        {
          user: toPublicUser(x.amigo),
          canal: { id: canal.id, nome: canal.name },
          servidor: { id: servidor.id, nome: servidor.name, iconUrl: servidor.iconUrl },
        },
      ];
    });
  },

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

  async block(userId: string, alvoId: string) {
    if (alvoId === userId) throw new AppError("Você não pode bloquear a si mesmo");

    const alvo = await userRepository.findById(alvoId);
    if (!alvo) throw new NotFoundError("Usuário não encontrado");

    const existente = await friendshipRepository.findBetween(userId, alvoId);

    if (existente) await friendshipRepository.remove(existente.id);

    await friendshipRepository.createBlocked(userId, alvoId);
  },

  async unblock(userId: string, alvoId: string) {
    const relacao = await friendshipRepository.findBetween(userId, alvoId);

    if (!relacao || relacao.status !== "BLOCKED") throw new AppError("Essa pessoa não está bloqueada");
    if (relacao.requesterId !== userId) throw new AppError("Quem bloqueou foi a outra pessoa");

    await friendshipRepository.remove(relacao.id);
  },

  async request(userId: string, username: string) {
    const alvo = await userRepository.findByUsernamePublic(username.replace(/^@/, "").trim());
    if (!alvo) throw new NotFoundError("Não achei ninguém com esse nome de usuário");
    if (alvo.id === userId) throw new AppError("Você não pode adicionar a si mesmo");

    const existente = await friendshipRepository.findBetween(userId, alvo.id);

    if (existente) {
      if (existente.status === "ACCEPTED") throw new AppError("Vocês já são amigos");
      if (existente.status === "BLOCKED") throw new AppError("Não foi possível enviar o pedido");

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

    if (relacao.addresseeId !== userId) throw new AppError("Este pedido não é seu");
    if (relacao.status !== "PENDING") throw new AppError("Este pedido já foi respondido");

    if (!aceitar) {
      await friendshipRepository.remove(relacao.id);
      return null;
    }

    return friendshipRepository.updateStatus(relacao.id, "ACCEPTED");
  },

  async remove(userId: string, friendshipId: string) {
    const relacao = await friendshipRepository.findById(friendshipId);
    if (!relacao) throw new NotFoundError("Não encontrado");

    if (relacao.requesterId !== userId && relacao.addresseeId !== userId) {
      throw new AppError("Esta relação não é sua");
    }

    await friendshipRepository.remove(relacao.id);
  },

  async openDm(userId: string, outroId: string) {
    const relacao = await friendshipRepository.findBetween(userId, outroId);

    if (relacao?.status === "BLOCKED") throw new AppError("Não foi possível abrir a conversa");
    if (!relacao || relacao.status !== "ACCEPTED") {
      throw new AppError("Vocês precisam ser amigos para conversar");
    }

    const existente = await dmRepository.findBetween(userId, outroId);
    if (existente) return toChannel(existente);

    return toChannel(await dmRepository.create([userId, outroId]));
  },

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
