import { botRepository } from "~/repositories/bot-repository.js";
import type { SelfUser } from "@gravae/shared";

import { AppError, NotFoundError } from "~/lib/http.js";
import { guildRepository, tagRepository } from "~/repositories/guild-repository.js";
import { noteRepository, userRepository } from "~/repositories/user-repository.js";
import {
  dmRepository,
  friendshipRepository,
  mutualRepository,
} from "~/repositories/friendship-repository.js";
import { currentStatus, toPublicUser } from "~/lib/serialize.js";
import { presenceService } from "./presence-service.js";

export type ProfileFriendship = "SELF" | "NONE" | "ACCEPTED" | "PENDING_IN" | "PENDING_OUT" | "BLOCKED";

export const profileService = {
  async view(viewerId: string, userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("Usuário não encontrado");

    const relation =
      viewerId === userId ? null : await friendshipRepository.findBetween(viewerId, userId);

    const guildsCommon =
      viewerId === userId ? [] : await mutualRepository.guildIdsInCommon(viewerId, userId);

    const hasDm =
      viewerId === userId || relation !== null || guildsCommon.length > 0
        ? true
        : Boolean(await dmRepository.findBetween(viewerId, userId));

    const canSee =
      viewerId === userId ||
      user.system === true ||
      relation !== null ||
      guildsCommon.length > 0 ||
      hasDm;

    if (!canSee) throw new NotFoundError("Usuário não encontrado");

    const picked = (user.profile as { tagGuildId?: string | null } | null)?.tagGuildId ?? null;

    const [presence, friendsCommon, note, tags] = await Promise.all([
      presenceService.mapFor([userId]),
      viewerId === userId
        ? Promise.resolve([] as string[])
        : mutualRepository.friendIdsInCommon(viewerId, userId),
      viewerId === userId ? Promise.resolve(null) : noteRepository.find(viewerId, userId),
      tagRepository.resolveMany(picked ? [picked] : []),
    ]);

    const serverTag = picked && tags.get(picked);

    let friendship: ProfileFriendship = "NONE";
    if (viewerId === userId) friendship = "SELF";
    else if (relation?.status === "ACCEPTED") friendship = "ACCEPTED";
    else if (relation?.status === "BLOCKED") friendship = "BLOCKED";
    else if (relation) friendship = relation.requesterId === viewerId ? "PENDING_OUT" : "PENDING_IN";

    const [bot] = user.isBot && !user.system ? await botRepository.findManyByUserIds([userId]) : [];
    const botId = bot && (bot.isPublic || bot.ownerId === viewerId) ? bot.id : null;

    return {
      ...toPublicUser(user),
      botId,
      status: presence[userId] ?? "OFFLINE",
      bio: user.bio,
      pronouns: user.pronouns,
      profile: (user.profile as SelfUser["profile"]) ?? null,
      serverTag: serverTag
        ? { guildId: picked, ...serverTag }
        : null,
      customStatus: currentStatus(user),
      createdAt: user.createdAt.toISOString(),
      friendship,
      friendshipId: relation?.id ?? null,
      mutualGuilds: guildsCommon.length,
      mutualFriends: friendsCommon.length,
      note: note?.text ?? null,
    };
  },

  async inCommon(viewerId: string, userId: string) {
    if (viewerId === userId) return { friends: [], servers: [] };

    const [relation, guildIds] = await Promise.all([
      friendshipRepository.findBetween(viewerId, userId),
      mutualRepository.guildIdsInCommon(viewerId, userId),
    ]);

    if (relation === null && guildIds.length === 0) throw new NotFoundError("Usuário não encontrado");

    const owner = await userRepository.findById(userId);

    const friendIds = owner?.showsFriendsCommon
      ? await mutualRepository.friendIdsInCommon(viewerId, userId)
      : [];

    const serversIds = owner?.showsServersCommon ? guildIds : [];

    const [friends, servers, presence] = await Promise.all([
      userRepository.findManyByIds(friendIds),
      guildRepository.findManyByIds(serversIds),
      presenceService.mapFor(friendIds),
    ]);

    return {
      friends: friends.map((friend) => ({
        ...toPublicUser(friend),
        status: presence[friend.id] ?? "OFFLINE",
      })),
      servers: servers.map((guild) => ({
        id: guild.id,
        name: guild.name,
        iconUrl: guild.iconUrl,
      })),
    };
  },

  async note(viewerId: string, userId: string, text: string) {
    if (viewerId === userId) throw new AppError("Anotacao e sobre outra pessoa");

    const target = await userRepository.findById(userId);
    if (!target) throw new NotFoundError("Usuario nao encontrado");

    const note = await noteRepository.upsert(viewerId, userId, text);
    return { note: note?.text ?? null };
  },
};
