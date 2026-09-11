import type { FriendshipStatus } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

const withUsers = { requester: true, addressee: true } as const;

export const friendshipRepository = {
  findBetween(a: string, b: string) {
    return prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: a, addresseeId: b },
          { requesterId: b, addresseeId: a },
        ],
      },
      include: withUsers,
    });
  },

  findById(id: string) {
    return prisma.friendship.findUnique({ where: { id }, include: withUsers });
  },

  findAllForUser(userId: string) {
    return prisma.friendship.findMany({
      where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
      include: withUsers,
      orderBy: { createdAt: "desc" },
    });
  },

  create(requesterId: string, addresseeId: string, note?: string | null) {
    return prisma.friendship.create({
      data: { requesterId, addresseeId, status: "PENDING", note: note ?? null },
      include: withUsers,
    });
  },

  createBlocked(requesterId: string, addresseeId: string) {
    return prisma.friendship.create({
      data: { requesterId, addresseeId, status: "BLOCKED" },
    });
  },

  updateStatus(id: string, status: FriendshipStatus) {
    return prisma.friendship.update({ where: { id }, data: { status }, include: withUsers });
  },

  remove(id: string) {
    return prisma.friendship.delete({ where: { id } });
  },
};

export const mutualRepository = {
  async guildIdsInCommon(a: string, b: string): Promise<string[]> {
    const [from, ofB] = await Promise.all([
      prisma.guildMember.findMany({ where: { userId: a }, select: { guildId: true } }),
      prisma.guildMember.findMany({ where: { userId: b }, select: { guildId: true } }),
    ]);

    const fromB = new Set(ofB.map((m) => m.guildId));
    return from.map((m) => m.guildId).filter((id) => fromB.has(id));
  },

  async friendIdsInCommon(a: string, b: string): Promise<string[]> {
    const friends = async (id: string) => {
      const relations = await prisma.friendship.findMany({
        where: { status: "ACCEPTED", OR: [{ requesterId: id }, { addresseeId: id }] },
      });

      return new Set(relations.map((r) => (r.requesterId === id ? r.addresseeId : r.requesterId)));
    };

    const [from, fromB] = await Promise.all([friends(a), friends(b)]);
    return [...from].filter((id) => fromB.has(id));
  },
};

export const dmRepository = {
  async findBetween(a: string, b: string) {
    const candidates = await prisma.channel.findMany({
      where: { guildId: null, recipients: { hasEvery: [a, b] } },
    });

    return candidates.find((c) => c.recipients.length === 2) ?? null;
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

const withWhoSent = { from: true } as const;

export const dmRepositoryRequest = {
  findByChannel(channelId: string) {
    return prisma.dmRequest.findUnique({ where: { channelId } });
  },

  create(channelId: string, fromId: string, toId: string, spam: boolean) {
    return prisma.dmRequest.create({ data: { channelId, fromId, toId, spam } });
  },

  pendingFor(toId: string) {
    return prisma.dmRequest.findMany({
      where: { toId, status: "PENDING" },
      include: withWhoSent,
      orderBy: { createdAt: "desc" },
    });
  },

  countPending(toId: string) {
    return prisma.dmRequest.count({ where: { toId, status: "PENDING", spam: false } });
  },

  accept(channelId: string) {
    return prisma.dmRequest.update({ where: { channelId }, data: { status: "ACCEPTED" } });
  },

  ignore(channelId: string, spam: boolean) {
    return prisma.dmRequest.update({
      where: { channelId },
      data: { status: "IGNORED", spam },
    });
  },

  async byChannel(channelIds: string[]) {
    const requests = await prisma.dmRequest.findMany({ where: { channelId: { in: channelIds } } });
    return new Map(requests.map((p) => [p.channelId, p]));
  },

  async previews(channelIds: string[]) {
    const messages = await prisma.message.findMany({
      where: { channelId: { in: channelIds } },
      orderBy: { createdAt: "asc" },
      select: { channelId: true, content: true },
    });

    const map = new Map<string, string>();
    for (const m of messages) if (!map.has(m.channelId)) map.set(m.channelId, m.content);

    return map;
  },
};
