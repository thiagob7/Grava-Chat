import type { FriendshipStatus } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

const comUsuarios = { requester: true, addressee: true } as const;

export const friendshipRepository = {
  /** A relação entre duas pessoas, em qualquer direção. */
  findBetween(a: string, b: string) {
    return prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: a, addresseeId: b },
          { requesterId: b, addresseeId: a },
        ],
      },
      include: comUsuarios,
    });
  },

  findById(id: string) {
    return prisma.friendship.findUnique({ where: { id }, include: comUsuarios });
  },

  /** Tudo que envolve a pessoa: amigos, pedidos enviados e recebidos. */
  findAllForUser(userId: string) {
    return prisma.friendship.findMany({
      where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
      include: comUsuarios,
      orderBy: { createdAt: "desc" },
    });
  },

  create(requesterId: string, addresseeId: string) {
    return prisma.friendship.create({
      data: { requesterId, addresseeId, status: "PENDING" },
      include: comUsuarios,
    });
  },

  updateStatus(id: string, status: FriendshipStatus) {
    return prisma.friendship.update({ where: { id }, data: { status }, include: comUsuarios });
  },

  remove(id: string) {
    return prisma.friendship.delete({ where: { id } });
  },
};

/** Servidores em comum entre duas pessoas — usado no perfil e na permissão de vê-lo. */
export const mutualRepository = {
  async guildIdsInCommon(a: string, b: string): Promise<string[]> {
    const [deA, deB] = await Promise.all([
      prisma.guildMember.findMany({ where: { userId: a }, select: { guildId: true } }),
      prisma.guildMember.findMany({ where: { userId: b }, select: { guildId: true } }),
    ]);

    const doB = new Set(deB.map((m) => m.guildId));
    return deA.map((m) => m.guildId).filter((id) => doB.has(id));
  },

  async friendIdsInCommon(a: string, b: string): Promise<number> {
    const amigosDe = async (id: string) => {
      const relacoes = await prisma.friendship.findMany({
        where: { status: "ACCEPTED", OR: [{ requesterId: id }, { addresseeId: id }] },
      });

      return new Set(relacoes.map((r) => (r.requesterId === id ? r.addresseeId : r.requesterId)));
    };

    const [deA, deB] = await Promise.all([amigosDe(a), amigosDe(b)]);
    return [...deA].filter((id) => deB.has(id)).length;
  },
};

export const dmRepository = {
  /**
   * Busca a conversa entre exatamente estas duas pessoas. `hasEvery` + tamanho
   * evita casar com um grupo que contenha as duas mais outras.
   */
  async findBetween(a: string, b: string) {
    const candidatos = await prisma.channel.findMany({
      where: { guildId: null, recipients: { hasEvery: [a, b] } },
    });

    return candidatos.find((c) => c.recipients.length === 2) ?? null;
  },

  create(recipients: string[]) {
    return prisma.channel.create({
      data: { guildId: null, name: "dm", type: "TEXT", recipients, isPrivate: true },
    });
  },

  findManyForUser(userId: string) {
    return prisma.channel.findMany({
      where: { guildId: null, recipients: { has: userId } },
      orderBy: { updatedAt: "desc" },
    });
  },
};
