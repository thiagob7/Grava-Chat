import type { ChannelType, Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

export const guildRepository = {
  /// Vários servidores pelo id, para resolver nome e ícone em lote.
  findManyByIds(ids: string[]) {
    if (!ids.length) return Promise.resolve([]);

    return prisma.guild.findMany({ where: { id: { in: ids } } });
  },

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

  remove(id: string) {
    return prisma.guild.delete({ where: { id } });
  },

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

export const tagRepository = {
  async resolverMuitas(guildIds: string[]) {
    if (!guildIds.length) return new Map<string, { tag: string; tagIcon: string | null }>();

    const guilds = await prisma.guild.findMany({
      where: { id: { in: guildIds }, NOT: { tag: null } },
      select: { id: true, tag: true, tagIcon: true },
    });

    return new Map(guilds.map((g) => [g.id, { tag: g.tag!, tagIcon: g.tagIcon }]));
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

  definirEmblemas(memberId: string, emblemIds: string[]) {
    return prisma.guildMember.update({ where: { id: memberId }, data: { emblemIds } });
  },

  async removerEmblemaDeTodos(guildId: string, emblemaId: string) {
    const afetados = await prisma.guildMember.findMany({
      where: { guildId, emblemIds: { has: emblemaId } },
      select: { id: true, emblemIds: true },
    });

    await Promise.all(
      afetados.map((m) =>
        prisma.guildMember.update({
          where: { id: m.id },
          data: { emblemIds: m.emblemIds.filter((id) => id !== emblemaId) },
        }),
      ),
    );
  },

  /// Onde a pessoa está, com que cargos e desde quando. O `joinedAt` é o piso
  /// das menções em canal nunca aberto: o que foi dito antes de ela chegar no
  /// servidor não é menção dela por ler.
  membershipsOf(userId: string) {
    return prisma.guildMember.findMany({
      where: { userId },
      select: { guildId: true, roleIds: true, joinedAt: true },
    });
  },

  create(data: {
    guildId: string;
    userId: string;
    roleIds?: string[];
    inviteCode?: string;
    invitedById?: string;
  }) {
    return prisma.guildMember.create({ data, include: { user: true } });
  },

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
  /// Vários canais de uma vez, pelo id. O "ativo agora" precisa resolver nome
  /// de canal para amigos espalhados por servidores diferentes.
  findManyByIds(ids: string[]) {
    if (!ids.length) return Promise.resolve([]);

    return prisma.channel.findMany({ where: { id: { in: ids } } });
  },

  findById(id: string) {
    return prisma.channel.findUnique({ where: { id } });
  },

  /// De que servidor é cada canal. A barra de servidores precisa disso para
  /// somar os não-lidos de quem não está aberto.
  guildIdsOf(channelIds: string[]) {
    if (!channelIds.length) return Promise.resolve([]);

    return prisma.channel.findMany({
      where: { id: { in: channelIds } },
      select: { id: true, guildId: true, name: true },
    });
  },

  findManyByGuild(guildId: string) {
    return prisma.channel.findMany({ where: { guildId }, orderBy: { position: "asc" } });
  },

  /// Os canais de voz de vários servidores de uma vez. O trilho precisa saber
  /// quem está em chamada em TODOS eles, e não um servidor por consulta.
  voiceChannelsOfGuilds(guildIds: string[]) {
    if (!guildIds.length) return Promise.resolve([]);

    return prisma.channel.findMany({
      where: { guildId: { in: guildIds }, type: "VOICE" },
      select: { id: true, guildId: true, name: true },
    });
  },

  /// Todos os canais de um punhado de servidores. A caixa de entrada precisa
  /// disso pra saber onde procurar menção sem varrer o banco inteiro.
  idsByGuilds(guildIds: string[]) {
    if (!guildIds.length) return Promise.resolve([]);

    return prisma.channel.findMany({
      where: { guildId: { in: guildIds } },
      select: { id: true },
    });
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

  async lastMessageIdByChannel(channelIds: string[]): Promise<Map<string, string>> {
    if (!channelIds.length) return new Map();

    const rows = (await prisma.message.aggregateRaw({
      pipeline: [
        { $match: { channelId: { $in: channelIds.map((id) => ({ $oid: id })) }, deletedAt: null } },
        { $group: { _id: "$channelId", lastId: { $max: "$_id" } } },
      ],
    })) as unknown as { _id: { $oid: string } | string; lastId: { $oid: string } | string }[];

    const oid = (v: { $oid: string } | string) => (typeof v === "string" ? v : v.$oid);
    return new Map(rows.map((r) => [oid(r._id), oid(r.lastId)]));
  },
};

export const emblemaRepository = {
  findManyByGuild(guildId: string) {
    return prisma.guildEmblem.findMany({ where: { guildId }, orderBy: { createdAt: "asc" } });
  },

  findById(id: string) {
    return prisma.guildEmblem.findUnique({ where: { id } });
  },

  countByGuild(guildId: string) {
    return prisma.guildEmblem.count({ where: { guildId } });
  },

  create(data: {
    guildId: string;
    nome: string;
    emoji: string | null;
    iconUrl: string | null;
    createdById: string;
  }) {
    return prisma.guildEmblem.create({ data });
  },

  remove(id: string) {
    return prisma.guildEmblem.delete({ where: { id } });
  },
};
