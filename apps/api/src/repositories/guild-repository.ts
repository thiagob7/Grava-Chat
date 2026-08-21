import type { ChannelType, Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

export const guildRepository = {
  findManyByUser(userId: string) {
    return prisma.guildMember.findMany({
      where: { userId },
      include: { guild: { include: { _count: { select: { members: true } } } } },
      orderBy: { joinedAt: "asc" },
    });
  },

  findByIdOrThrow(id: string) {
    return prisma.guild.findUniqueOrThrow({
      where: { id },
      include: { _count: { select: { members: true } } },
    });
  },

  findById(id: string) {
    return prisma.guild.findUnique({ where: { id } });
  },

  update(id: string, data: Prisma.GuildUpdateInput) {
    return prisma.guild.update({
      where: { id },
      data,
      include: { _count: { select: { members: true } } },
    });
  },

  /** Apagar leva junto canais, mensagens, convites e membros (cascata do Prisma). */
  remove(id: string) {
    return prisma.guild.delete({ where: { id } });
  },

  /** Cria o servidor já com dono e as categorias padrão, numa operação só. */
  createWithDefaults(params: {
    name: string;
    ownerId: string;
    categories: string[];
    everyonePermissions: string[];
  }) {
    return prisma.guild.create({
      data: {
        name: params.name,
        ownerId: params.ownerId,
        // o dono não precisa de cargo: `guild.ownerId` já lhe dá tudo
        members: { create: { userId: params.ownerId } },
        categories: {
          create: params.categories.map((name, position) => ({ name, position })),
        },
        roles: {
          create: {
            name: "@everyone",
            position: 0,
            permissions: params.everyonePermissions,
            isEveryone: true,
          },
        },
      },
      include: { categories: { orderBy: { position: "asc" } } },
    });
  },
};

export const memberRepository = {
  find(guildId: string, userId: string) {
    return prisma.guildMember.findUnique({ where: { guildId_userId: { guildId, userId } } });
  },

  findManyByGuild(guildId: string) {
    return prisma.guildMember.findMany({
      where: { guildId },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    });
  },

  guildIdsOf(userId: string) {
    return prisma.guildMember.findMany({ where: { userId }, select: { guildId: true } });
  },

  create(data: { guildId: string; userId: string; roleIds?: string[] }) {
    return prisma.guildMember.create({ data, include: { user: true } });
  },

  /** Castigo: até quando a pessoa fica sem escrever nem falar. null = solta. */
  setTimeout(guildId: string, userId: string, ate: Date | null) {
    return prisma.guildMember.update({
      where: { guildId_userId: { guildId, userId } },
      data: { timeoutUntil: ate },
      include: { user: true },
    });
  },

  setNickname(guildId: string, userId: string, nickname: string | null) {
    return prisma.guildMember.update({
      where: { guildId_userId: { guildId, userId } },
      data: { nickname },
      include: { user: true },
    });
  },

  setRoles(guildId: string, userId: string, roleIds: string[]) {
    return prisma.guildMember.update({
      where: { guildId_userId: { guildId, userId } },
      data: { roleIds },
      include: { user: true },
    });
  },

  /** Tira um cargo apagado de todo mundo — o Mongo não faz isso por nós. */
  async pullRole(guildId: string, roleId: string) {
    const afetados = await prisma.guildMember.findMany({
      where: { guildId, roleIds: { has: roleId } },
      select: { userId: true, roleIds: true },
    });

    await Promise.all(
      afetados.map((m) =>
        prisma.guildMember.update({
          where: { guildId_userId: { guildId, userId: m.userId } },
          data: { roleIds: m.roleIds.filter((id) => id !== roleId) },
        }),
      ),
    );
  },

  remove(guildId: string, userId: string) {
    return prisma.guildMember.delete({ where: { guildId_userId: { guildId, userId } } });
  },
};

export const categoryRepository = {
  findManyByGuild(guildId: string) {
    return prisma.category.findMany({ where: { guildId }, orderBy: { position: "asc" } });
  },

  lastPosition(guildId: string) {
    return prisma.category.findFirst({
      where: { guildId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
  },

  create(data: { guildId: string; name: string; position: number }) {
    return prisma.category.create({ data });
  },
};

export const channelRepository = {
  findById(id: string) {
    return prisma.channel.findUnique({ where: { id } });
  },

  findManyByGuild(guildId: string) {
    return prisma.channel.findMany({ where: { guildId }, orderBy: { position: "asc" } });
  },

  lastPosition(guildId: string, categoryId: string | null) {
    return prisma.channel.findFirst({
      where: { guildId, categoryId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
  },

  create(data: {
    guildId: string;
    categoryId: string | null;
    name: string;
    type: ChannelType;
    topic: string | null;
    isPrivate: boolean;
    position: number;
  }) {
    return prisma.channel.create({ data });
  },

  createMany(data: Prisma.ChannelCreateManyInput[]) {
    return prisma.channel.createMany({ data });
  },

  update(id: string, data: Prisma.ChannelUpdateInput) {
    return prisma.channel.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.channel.delete({ where: { id } });
  },

  /**
   * Última mensagem de cada canal numa agregação só, em vez de uma consulta por
   * canal. É o que alimenta a bolinha de não-lido sem N+1.
   */
  async lastMessageIdByChannel(channelIds: string[]): Promise<Map<string, string>> {
    if (!channelIds.length) return new Map();

    const rows = (await prisma.message.aggregateRaw({
      pipeline: [
        // No $match nativo do Mongo, `null` já casa com campo ausente — a
        // pegadinha do `deletedAt: null` é só na tradução do Prisma.
        { $match: { channelId: { $in: channelIds.map((id) => ({ $oid: id })) }, deletedAt: null } },
        { $group: { _id: "$channelId", lastId: { $max: "$_id" } } },
      ],
    })) as unknown as { _id: { $oid: string } | string; lastId: { $oid: string } | string }[];

    const oid = (v: { $oid: string } | string) => (typeof v === "string" ? v : v.$oid);
    return new Map(rows.map((r) => [oid(r._id), oid(r.lastId)]));
  },
};
