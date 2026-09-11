import { connectionAddress, type ProfileStyle } from "@gravae/shared";

import type { UpdateProfileInput } from "~/validations/auth.js";
import { AppError } from "~/lib/http.js";
import { authService } from "./auth-service.js";
import { redis } from "~/lib/redis.js";
import { prisma } from "~/lib/prisma.js";
import {
  memberRepository,
  tagRepository,
} from "~/repositories/guild-repository.js";
import { userRepository } from "~/repositories/user-repository.js";

const WINDOW_S = 2;
const BY_WINDOW = 10;

const MESSAGES_CEILING = 10_000;

const REGRET_DAYS = 15;

export const meService = {
  async requestDeletion(userId: string) {
    const owner = await prisma.guild.findMany({
      where: { ownerId: userId },
      select: { name: true, _count: { select: { members: true } } },
    });

    const withFolks = owner
      .filter((g) => g._count.members > 1)
      .map((g) => g.name);

    if (withFolks.length) {
      throw new AppError(
        `Você ainda é dono de ${withFolks.length === 1 ? "um servidor" : "servidores"} com outras pessoas (${withFolks.join(", ")}). Passe a posse ou exclua ${withFolks.length === 1 ? "ele" : "eles"} antes.`,
      );
    }

    const deleteAt = new Date(
      Date.now() + REGRET_DAYS * 24 * 60 * 60 * 1000,
    );

    await userRepository.update(userId, { deleteAt });
    await authService.revokeAll(userId);

    return { deleteAt: deleteAt.toISOString() };
  },

  async cancelDeletion(userId: string) {
    await userRepository.update(userId, { deleteAt: null });
  },

  async doExport(userId: string) {
    const [user, members, friendships, messages, countMessages] =
      await Promise.all([
        userRepository.findById(userId),
        prisma.guildMember.findMany({
          where: { userId },
          select: {
            joinedAt: true,
            guild: { select: { id: true, name: true } },
          },
        }),
        prisma.friendship.findMany({
          where: {
            OR: [{ requesterId: userId }, { addresseeId: userId }],
            status: "ACCEPTED",
          },
          select: {
            createdAt: true,
            requester: { select: { id: true, username: true } },
            addressee: { select: { id: true, username: true } },
          },
        }),
        prisma.message.findMany({
          where: { authorId: userId, deletedAt: null },
          select: { id: true, channelId: true, content: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: MESSAGES_CEILING,
        }),
        prisma.message.count({ where: { authorId: userId, deletedAt: null } }),
      ]);

    if (!user) throw new AppError("Conta não encontrada", 404);

    return {
      generatedAt: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        pronouns: user.pronouns,
        createdAt: user.createdAt.toISOString(),
        acceptedRequests: user.acceptedRequests,
        showsActivity: user.showsActivity,
        showsServersCommon: user.showsServersCommon,
        showsFriendsCommon: user.showsFriendsCommon,
        membersAllowDm: user.membersAllowDm,
        spamFilter: user.spamFilter,
      },
      servers: members.map((m) => ({
        id: m.guild.id,
        name: m.guild.name,
        joinedAt: m.joinedAt.toISOString(),
      })),
      friends: friendships.map((a) => {
        const other = a.requester.id === userId ? a.addressee : a.requester;
        return {
          id: other.id,
          username: other.username,
          since: a.createdAt.toISOString(),
        };
      }),
      messages: {
        total: countMessages,
        included: messages.length,
        note:
          countMessages > messages.length
            ? `Só as ${messages.length} mais recentes entraram neste arquivo.`
            : null,
        list: messages.map((m) => ({
          id: m.id,
          channelId: m.channelId,
          content: m.content,
          when: m.createdAt.toISOString(),
        })),
      },
    };
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    await respectThroughput(userId);

    if (input.profile?.tagGuildId) {
      await requireCanWearTag(userId, input.profile.tagGuildId);
    }

    return userRepository.update(userId, {
      ...(input.acceptedRequests !== undefined
        ? { acceptedRequests: input.acceptedRequests }
        : {}),
      ...(input.showsActivity !== undefined
        ? { showsActivity: input.showsActivity }
        : {}),
      ...(input.showsServersCommon !== undefined
        ? { showsServersCommon: input.showsServersCommon }
        : {}),
      ...(input.showsFriendsCommon !== undefined
        ? { showsFriendsCommon: input.showsFriendsCommon }
        : {}),
      ...(input.membersAllowDm !== undefined
        ? { membersAllowDm: input.membersAllowDm }
        : {}),
      ...(input.spamFilter !== undefined ? { spamFilter: input.spamFilter } : {}),
      ...(input.displayName !== undefined
        ? { displayName: input.displayName }
        : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.pronouns !== undefined ? { pronouns: input.pronouns } : {}),
      ...(input.profile !== undefined
        ? {
            profile: input.profile
              ? withConnectionsClean(input.profile)
              : { unset: true },
          }
        : {}),
      ...(input.customStatus !== undefined
        ? {
            customStatus: input.customStatus
              ? {
                  text: input.customStatus.text,
                  emoji: input.customStatus.emoji ?? null,
                  expiresAt: input.customStatus.expiresAt
                    ? new Date(input.customStatus.expiresAt)
                    : null,
                }
              : { unset: true },
          }
        : {}),
    });
  },
};

function withConnectionsClean(profile: ProfileStyle): ProfileStyle {
  if (!profile.connections) return profile;

  return {
    ...profile,
    connections: profile.connections
      .map((connection) => ({
        ...connection,
        value: connection.value.trim().replace(/^@/, ""),
      }))
      .filter((connection) => connectionAddress(connection) !== null),
  };
}

async function requireCanWearTag(userId: string, guildId: string) {
  const member = await memberRepository.find(guildId, userId);
  if (!member) throw new AppError("Você não é membro desse servidor");

  const tags = await tagRepository.resolveMany([guildId]);
  if (!tags.has(guildId))
    throw new AppError("Esse servidor não tem etiqueta");
}

async function respectThroughput(userId: string) {
  const key = `me:rate:${userId}`;
  const uses = await redis.incr(key);

  if (uses === 1) await redis.expire(key, WINDOW_S);
  if (uses > BY_WINDOW)
    throw new AppError("Devagar — muitas alterações seguidas", 429);
}
