import type { FriendshipStatus } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

const comUsuarios = { requester: true, addressee: true } as const;

export const friendshipRepository = {
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

  createBlocked(requesterId: string, addresseeId: string) {
    return prisma.friendship.create({
      data: { requesterId, addresseeId, status: "BLOCKED" },
    });
  },

  updateStatus(id: string, status: FriendshipStatus) {
    return prisma.friendship.update({ where: { id }, data: { status }, include: comUsuarios });
  },

  remove(id: string) {
    return prisma.friendship.delete({ where: { id } });
  },
};

export const mutualRepository = {
  async guildIdsInCommon(a: string, b: string): Promise<string[]> {
    const [deA, deB] = await Promise.all([
      prisma.guildMember.findMany({ where: { userId: a }, select: { guildId: true } }),
      prisma.guildMember.findMany({ where: { userId: b }, select: { guildId: true } }),
    ]);

    const doB = new Set(deB.map((m) => m.guildId));
    return deA.map((m) => m.guildId).filter((id) => doB.has(id));
  },

  async friendIdsInCommon(a: string, b: string): Promise<string[]> {
    const amigosDe = async (id: string) => {
      const relacoes = await prisma.friendship.findMany({
        where: { status: "ACCEPTED", OR: [{ requesterId: id }, { addresseeId: id }] },
      });

      return new Set(relacoes.map((r) => (r.requesterId === id ? r.addresseeId : r.requesterId)));
    };

    const [deA, deB] = await Promise.all([amigosDe(a), amigosDe(b)]);
    return [...deA].filter((id) => deB.has(id));
  },
};

export const dmRepository = {
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

const comQuemMandou = { from: true } as const;

export const pedidoDeDmRepository = {
  findByChannel(channelId: string) {
    return prisma.pedidoDeDm.findUnique({ where: { channelId } });
  },

  create(channelId: string, fromId: string, toId: string, spam: boolean) {
    return prisma.pedidoDeDm.create({ data: { channelId, fromId, toId, spam } });
  },

  pendentesPara(toId: string) {
    return prisma.pedidoDeDm.findMany({
      where: { toId, status: "PENDING" },
      include: comQuemMandou,
      orderBy: { createdAt: "desc" },
    });
  },

  contarPendentes(toId: string) {
    return prisma.pedidoDeDm.count({ where: { toId, status: "PENDING", spam: false } });
  },

  aceitar(channelId: string) {
    return prisma.pedidoDeDm.update({ where: { channelId }, data: { status: "ACCEPTED" } });
  },

  ignorar(channelId: string, spam: boolean) {
    return prisma.pedidoDeDm.update({
      where: { channelId },
      data: { status: "IGNORED", spam },
    });
  },

  async porCanal(channelIds: string[]) {
    const pedidos = await prisma.pedidoDeDm.findMany({ where: { channelId: { in: channelIds } } });
    return new Map(pedidos.map((p) => [p.channelId, p]));
  },

  async previas(channelIds: string[]) {
    const mensagens = await prisma.message.findMany({
      where: { channelId: { in: channelIds } },
      orderBy: { createdAt: "asc" },
      select: { channelId: true, content: true },
    });

    const mapa = new Map<string, string>();
    for (const m of mensagens) if (!mapa.has(m.channelId)) mapa.set(m.channelId, m.content);

    return mapa;
  },
};
