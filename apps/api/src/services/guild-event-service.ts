import { EVENT_LIMITS, type EventFrequency, type GuildEvent } from "@gravae/shared";

import type { FastifyBaseLogger } from "fastify";

import { AppError, NotFoundError } from "~/lib/http.js";
import { unset } from "~/lib/mongo.js";
import { prisma } from "~/lib/prisma.js";
import { channelRepository } from "~/repositories/guild-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "~/services/access-service.js";

type EventRow = {
  id: string;
  guildId: string;
  authorId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  startsAt: Date;
  frequency: string;
  channelId: string | null;
  externalLocation: string | null;
  interestedIds: string[];
  startedAt: Date | null;
};

export interface GuildEventInput {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  startsAt: string;
  frequency: EventFrequency;
  channelId?: string | null;
  externalLocation?: string | null;
}

const START_CHECK_MS = 60_000;
const START_DELAY_MS = 15_000;

const LIVE = unset("canceledAt");

function toGuildEvent(
  row: EventRow,
  userId: string,
  channelName: string | null,
  author: GuildEvent["author"],
): GuildEvent {
  return {
    id: row.id,
    guildId: row.guildId,
    name: row.name,
    description: row.description,
    imageUrl: row.imageUrl,
    startsAt: row.startsAt.toISOString(),
    frequency: row.frequency as EventFrequency,
    channelId: row.channelId,
    channelName,
    externalLocation: row.externalLocation,
    interestedCount: row.interestedIds.length,
    isInterested: row.interestedIds.includes(userId),
    startedAt: row.startedAt?.toISOString() ?? null,
    author,
  };
}

async function requirePlace(guildId: string, input: GuildEventInput) {
  const hasChannel = Boolean(input.channelId);
  const hasText = Boolean(input.externalLocation?.trim());

  if (hasChannel === hasText) {
    throw new AppError("Escolha um canal de voz OU um lugar de fora, não os dois");
  }

  if (!input.channelId) return null;

  const channel = await channelRepository.findById(input.channelId);
  if (!channel || channel.guildId !== guildId) throw new NotFoundError("Canal não encontrado");
  if (channel.type !== "VOICE") throw new AppError("O evento só marca canal de voz");

  return channel;
}

async function findInGuild(guildId: string, eventId: string) {
  const found = await prisma.guildEvent.findUnique({ where: { id: eventId } });
  if (!found || found.guildId !== guildId) throw new NotFoundError("Evento não encontrado");

  return found;
}

export const guildEventService = {
  async startDue(): Promise<number> {
    const { count } = await prisma.guildEvent.updateMany({
      where: {
        AND: [unset("startedAt"), LIVE, { startsAt: { lte: new Date() } }],
      },
      data: { startedAt: new Date() },
    });

    return count;
  },

  watch(log?: FastifyBaseLogger) {
    const round = () => {
      void guildEventService
        .startDue()
        .then((started) => started && log?.info({ started }, "events started on their own"))
        .catch((err) => log?.error({ err }, "event round failed"));
    };

    const first = setTimeout(round, START_DELAY_MS);
    const clock = setInterval(round, START_CHECK_MS);

    return () => {
      clearTimeout(first);
      clearInterval(clock);
    };
  },

  async list(userId: string, guildId: string): Promise<GuildEvent[]> {
    await accessService.requireMember(userId, guildId);

    const rows = await prisma.guildEvent.findMany({
      where: { guildId, ...LIVE },
      orderBy: { startsAt: "asc" },
      take: EVENT_LIMITS.perGuild,
    });

    if (!rows.length) return [];

    const channels = await channelRepository.findManyByGuild(guildId);
    const channelNames = new Map(channels.map((channel) => [channel.id, channel.name]));

    const authors = await userRepository.findManyByIds([...new Set(rows.map((row) => row.authorId))]);
    const authorsById = new Map(
      authors.map((user) => [
        user.id,
        {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      ]),
    );

    return rows.map((row) =>
      toGuildEvent(
        row,
        userId,
        row.channelId ? (channelNames.get(row.channelId) ?? null) : null,
        authorsById.get(row.authorId) ?? null,
      ),
    );
  },

  async create(userId: string, guildId: string, input: GuildEventInput) {
    await accessService.requirePermission(userId, guildId, "MANAGE_EVENTS");

    const total = await prisma.guildEvent.count({ where: { guildId, ...LIVE } });
    if (total >= EVENT_LIMITS.perGuild) {
      throw new AppError(`Este servidor já tem ${EVENT_LIMITS.perGuild} eventos marcados`);
    }

    const channel = await requirePlace(guildId, input);

    const created = await prisma.guildEvent.create({
      data: {
        guildId,
        authorId: userId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        imageUrl: input.imageUrl ?? null,
        startsAt: new Date(input.startsAt),
        frequency: input.frequency,
        channelId: input.channelId ?? null,
        externalLocation: input.externalLocation?.trim() || null,
        interestedIds: [userId],
        startedAt: null,
        canceledAt: null,
      },
    });

    const author = await userRepository.findByIdOrThrow(userId);

    return toGuildEvent(created, userId, channel?.name ?? null, {
      id: author.id,
      username: author.username,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl,
    });
  },

  async update(userId: string, guildId: string, eventId: string, input: GuildEventInput) {
    await accessService.requirePermission(userId, guildId, "MANAGE_EVENTS");
    await findInGuild(guildId, eventId);

    const channel = await requirePlace(guildId, input);

    const updated = await prisma.guildEvent.update({
      where: { id: eventId },
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        imageUrl: input.imageUrl ?? null,
        startsAt: new Date(input.startsAt),
        frequency: input.frequency,
        channelId: input.channelId ?? null,
        externalLocation: input.externalLocation?.trim() || null,
      },
    });

    return toGuildEvent(updated, userId, channel?.name ?? null, null);
  },

  async cancel(userId: string, guildId: string, eventId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_EVENTS");
    await findInGuild(guildId, eventId);

    await prisma.guildEvent.update({ where: { id: eventId }, data: { canceledAt: new Date() } });

    return { id: eventId };
  },

  async setInterest(userId: string, guildId: string, eventId: string, interested: boolean) {
    await accessService.requireMember(userId, guildId);

    const event = await findInGuild(guildId, eventId);

    const interestedIds = interested
      ? [...new Set([...event.interestedIds, userId])]
      : event.interestedIds.filter((id) => id !== userId);

    await prisma.guildEvent.update({ where: { id: eventId }, data: { interestedIds } });

    return { id: eventId, interestedCount: interestedIds.length, isInterested: interested };
  },
};
