import { randomUUID } from "node:crypto";
import type { SearchQuery } from "~/validations/message.js";
import { guildRepository } from "~/repositories/guild-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { has, LIMITS, type ReactionPeople } from "@gravae/shared";
import { AppError, ForbiddenError, NotFoundError } from "~/lib/http.js";
import {
  messageRepository,
  reactionRepository,
  readStateRepository,
} from "~/repositories/message-repository.js";
import { toMessage, toPublicUser } from "~/lib/serialize.js";
import { dmRepository } from "~/repositories/friendship-repository.js";
import { channelRepository, memberRepository } from "~/repositories/guild-repository.js";
import { expressionRepository } from "~/repositories/expression-repository.js";
import { redis, keys } from "~/lib/redis.js";
import { roleRepository } from "~/repositories/role-repository.js";
import { accessService, type Context } from "./access-service.js";
import { autoModService } from "./automod-service.js";
import { forumService } from "./forum-service.js";
import {
  flowPassed,
  flowMessage,
  WINDOW_S as FLOW_S_WINDOW,
} from "~/lib/fluxo-de-mensagens.js";
import { uploadService } from "./upload-service.js";
import type { EditMessageInput, SendMessageInput } from "~/validations/message.js";

const USER_MENTION = /<@([a-f\d]{24})>/gi;
const ROLE_MENTION = /<@&([a-f\d]{24})>/gi;
const ALL_MENTION = /@(everyone|here)\b/;

const unique = (ids: string[]) => ids.filter((v, i, a) => a.indexOf(v) === i);

const extractMentions = (content: string) =>
  unique([...content.matchAll(USER_MENTION)].map((m) => m[1]!));

const extractRoles = (content: string) =>
  unique([...content.matchAll(ROLE_MENTION)].map((m) => m[1]!));

async function resolveMentions(
  content: string,
  guildId: string | null,
  context: Context | null,
): Promise<{ mentionRoleIds: string[]; mentionEveryone: boolean }> {
  if (!guildId || !context) return { mentionRoleIds: [], mentionEveryone: false };

  const canAll = has(context.permissions, "MENTION_EVERYONE");
  const requests = extractRoles(content);

  if (!requests.length) {
    return { mentionRoleIds: [], mentionEveryone: canAll && ALL_MENTION.test(content) };
  }

  const roleList = await roleRepository.findManyByGuild(guildId);
  const allowed = new Set(
    roleList.filter((c) => canAll || c.mentionable).map((c) => c.id),
  );

  return {
    mentionRoleIds: requests.filter((id) => allowed.has(id)),
    mentionEveryone: canAll && ALL_MENTION.test(content),
  };
}

const WHO_REACTED_LIMIT = 50;

export const messageService = {
  async history(
    userId: string,
    channelId: string,
    params: { before?: string; limit: number; postId?: string },
  ) {
    const { context } = await accessService.requireChannelAccess(userId, channelId);

    if (context && !has(context.permissions, "READ_MESSAGE_HISTORY")) {
      return { messages: [], hasMore: false, withoutHistory: true as const };
    }

    const messages = await messageRepository.findPage({ channelId, ...params });

    return {
      messages: messages.reverse().map((m) => toMessage(m, userId)),
      hasMore: messages.length === params.limit,
      withoutHistory: false as const,
    };
  },

  async search(userId: string, params: Omit<SearchQuery, "q"> & { term: string }) {
    const scope =
      params.scope ?? (params.guildId ? "servidor" : "canal");

    const fromServers = async () => {
      const memberships = await guildRepository.findManyByUser(userId);
      const byServer = await Promise.all(
        memberships.map((m) => accessService.readableChannels(userId, m.guildId)),
      );
      return byServer.flat();
    };
    const fromChats = async () =>
      (await dmRepository.findManyForUser(userId)).map((c) => c.id);

    const channels =
      scope === "tudo"
        ? [...(await fromServers()), ...(await fromChats())]
        : scope === "comunidades"
          ? await fromServers()
          : scope === "dms"
            ? await fromChats()
            : params.guildId
              ? await accessService.readableChannels(userId, params.guildId)
              : await accessService
                  .requireChannelAccess(userId, params.channelId!)
                  .then(({ channel }) => [channel.id]);

    const lines = await messageRepository.search({
      channelIds: channels,
      term: params.term,
      channelId: scope === "servidor" || scope === "canal" ? params.channelId : undefined,
      authorId: params.authorId,
      mentionsId: params.mentionsId,
      has: params.has,
      after: params.after,
      until: params.until,
      em: params.em,
      pinned: params.pinned,
      authorKind: params.authorKind,
      order: params.order ?? "recente",
      before: params.before,
      limit: 25,
    });

    return {
      messages: lines.map((m) => ({
        ...toMessage(m, userId),
        channelName: m.channel.name,
        channelType: m.channel.type,
      })),
      hasMore: lines.length === 25,
    };
  },

  async send(userId: string, input: SendMessageInput) {
    const { channel, context } = await accessService.requireChannelAccess(userId, input.channelId);

    if (channel.type === "FORUM" && !input.postId) {
      throw new AppError("No fórum, a mensagem vai dentro de um assunto");
    }

    if (input.postId) await forumService.requirePostIsOpen(input.postId, channel.id);

    if (!channel.guildId) {
      const otherId = (channel.recipients ?? []).find((id) => id !== userId);
      const other = otherId ? await userRepository.findById(otherId) : null;

      if (other?.system) {
        throw new ForbiddenError("Esta conversa é só de avisos da casa. Não dá para responder aqui.").having(
          "recusada",
        );
      }
    }

    let messageGuild: Awaited<ReturnType<typeof guildRepository.findById>> = null;

    if (context) {
      timeoutRequireNotThis(context);

      if (!has(context.permissions, "SEND_MESSAGES")) {
        throw new ForbiddenError("Você não pode escrever neste canal").having("sem-permissao");
      }

      if (input.attachments?.length && !has(context.permissions, "ATTACH_FILES")) {
        throw new ForbiddenError("Você não pode anexar arquivos neste canal").having("sem-permissao");
      }

      if (input.poll && !has(context.permissions, "CREATE_POLLS")) {
        throw new ForbiddenError("Você não pode criar enquetes neste canal").having("sem-permissao");
      }

      await respectModeSlow(userId, channel, context);

      if (channel.guildId) {
        messageGuild = await guildRepository.findById(channel.guildId);
        await verifiedRequireEmail(userId, messageGuild, context);
      }
    }

    await ensureFlow(userId);

    const content = input.content.trim();
    if (!content && !input.attachments?.length && !input.poll && !input.stickerId) {
      throw new AppError("Mensagem vazia");
    }

    if (input.stickerId) {
      const sticker = await expressionRepository.findStickerById(input.stickerId);
      if (!sticker || sticker.guildId !== channel.guildId) {
        throw new NotFoundError("Figurinha não encontrada");
      }
    }

    if (channel.guildId && context) {
      await autoModService.evaluate({
        guildId: channel.guildId,
        channelId: channel.id,
        userId,
        context,
        content,
      });
    }

    const authorReplied =
      input.mentionAuthor && input.replyToId
        ? await messageRepository
            .findById(input.replyToId)
            .then((m) => (m && m.authorId !== userId ? m.authorId : null))
            .catch(() => null)
        : null;

    const created = await messageRepository.create({
      channelId: input.channelId,
      authorId: userId,
      content,
      ...(input.font && input.font !== "padrao" ? { font: input.font } : {}),
      attachments: (input.attachments ?? []).map((a) => ({
        ...a,
        width: a.width ?? null,
        height: a.height ?? null,
        spoiler: a.spoiler || (messageGuild?.filtersMediaExplicit === true && isMedia(a.contentType)),
        description: a.description ?? null,
        durationMs: a.durationMs ?? null,
        waves: a.waves ?? null,
      })),
      ...(input.poll ? { poll: buildPoll(input.poll) } : {}),
      ...(input.stickerId ? { stickerId: input.stickerId } : {}),
      ...(input.postId ? { postId: input.postId } : {}),
      replyToId: input.replyToId ?? null,
      channelForwardedId: input.forwarded?.channelId ?? null,
      messageForwardedId: input.forwarded?.messageId ?? null,
      mentions: unique([
        ...extractMentions(content),
        ...(authorReplied ? [authorReplied] : []),
      ]),
      ...(await resolveMentions(content, channel.guildId, context)),
    });

    if (input.postId) await forumService.registerReply(input.postId).catch(() => undefined);

    await readStateRepository.markRead(userId, input.channelId, created.id);

    return toMessage(created, userId);
  },

  async edit(userId: string, input: EditMessageInput) {
    const existing = await messageRepository.findById(input.messageId);
    if (!existing || existing.deletedAt) throw new NotFoundError("Mensagem não encontrada");
    if (existing.authorId !== userId) throw new ForbiddenError("Você só pode editar as suas mensagens");

    const content = input.content.trim();

    const { context } = await accessService.requireChannelAccess(userId, existing.channelId);
    const channel = await channelRepository.findById(existing.channelId);

    const updated = await messageRepository.update(input.messageId, {
      content,
      editedAt: new Date(),
      mentions: extractMentions(content),
      ...(await resolveMentions(content, channel?.guildId ?? null, context)),
    });

    return toMessage(updated, userId);
  },

  async remove(userId: string, messageId: string) {
    const existing = await messageRepository.findById(messageId);
    if (!existing || existing.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    const { context } = await accessService.requireChannelAccess(userId, existing.channelId);
    const isAuthor = existing.authorId === userId;
    const canModerate = Boolean(context && has(context.permissions, "MANAGE_MESSAGES"));

    if (!isAuthor && !canModerate) throw new ForbiddenError("Sem permissão para apagar esta mensagem");

    await messageRepository.softDelete(messageId);

    void uploadService.remove(existing.attachments.map((a) => a.id));

    return { messageId, channelId: existing.channelId };
  },

  async removeAttachment(userId: string, messageId: string, attachmentId: string) {
    const existing = await messageRepository.findById(messageId);
    if (!existing || existing.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    const target = existing.attachments.find((a) => a.id === attachmentId);
    if (!target) throw new NotFoundError("Anexo não encontrado");

    const { context } = await accessService.requireChannelAccess(userId, existing.channelId);
    const isAuthor = existing.authorId === userId;
    const canModerate = Boolean(context && has(context.permissions, "MANAGE_MESSAGES"));

    if (!isAuthor && !canModerate) {
      throw new ForbiddenError("Sem permissão para mexer nesta mensagem");
    }

    const remaining = existing.attachments.filter((a) => a.id !== attachmentId);
    const emptyStayed =
      remaining.length === 0 &&
      !existing.content?.trim() &&
      !existing.poll &&
      !existing.stickerId;

    void uploadService.remove([attachmentId]);

    if (emptyStayed) {
      await messageRepository.softDelete(messageId);
      return { deletedMessage: true as const, channelId: existing.channelId, messageId };
    }

    await messageRepository.update(messageId, { attachments: { set: remaining } });

    const updated = await messageRepository.findByIdWithRelations(messageId);

    return {
      deletedMessage: false as const,
      channelId: existing.channelId,
      message: toMessage(updated!, userId),
    };
  },

  async pin(userId: string, messageId: string, pin: boolean) {
    const existing = await messageRepository.findById(messageId);
    if (!existing || existing.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    const { context } = await accessService.requireChannelAccess(userId, existing.channelId);

    const canPin =
      has(context?.permissions ?? new Set(), "PIN_MESSAGES") ||
      has(context?.permissions ?? new Set(), "MANAGE_MESSAGES");

    if (context && !canPin) {
      throw new ForbiddenError("Você não pode fixar mensagens neste canal");
    }

    if (pin) {
      const pinned = await messageRepository.countPinned(existing.channelId);
      if (pinned >= LIMITS.messagesPinned) {
        throw new AppError(`O canal já tem ${LIMITS.messagesPinned} mensagens fixadas`);
      }
    }

    const updated = await messageRepository.update(messageId, {
      pinnedAt: pin ? new Date() : null,
      pinnedById: pin ? userId : null,
    });

    return toMessage(updated, userId);
  },

  async pinned(userId: string, channelId: string) {
    await accessService.requireChannelAccess(userId, channelId);

    const messages = await messageRepository.findPinned(channelId);
    return messages.map((m) => toMessage(m, userId));
  },

  async vote(userId: string, messageId: string, optionId: string) {
    const message = await messageRepository.findByIdWithRelations(messageId);
    if (!message.poll || message.deletedAt) throw new NotFoundError("Enquete não encontrada");

    await accessService.requireChannelAccess(userId, message.channelId);

    const closed =
      message.poll.closedAt !== null ||
      (message.poll.expiresAt !== null && message.poll.expiresAt < new Date());
    if (closed) throw new AppError("Esta enquete já encerrou");

    const alreadyVoted = message.poll.options.some(
      (o) => o.id === optionId && o.userIds.includes(userId),
    );

    const options = message.poll.options.map((o) => {
      const withoutThisVote = o.userIds.filter((id) => id !== userId);

      if (o.id !== optionId) {
        return { ...o, userIds: message.poll!.multiSelect ? o.userIds : withoutThisVote };
      }

      return { ...o, userIds: alreadyVoted ? withoutThisVote : [...withoutThisVote, userId] };
    });

    const updated = await messageRepository.update(messageId, {
      poll: { ...message.poll, options },
    });

    return toMessage(updated, userId);
  },

  async endPoll(userId: string, messageId: string) {
    const message = await messageRepository.findByIdWithRelations(messageId);
    if (!message.poll) throw new NotFoundError("Enquete não encontrada");
    if (message.authorId !== userId) throw new ForbiddenError("Só quem criou encerra a enquete");

    const updated = await messageRepository.update(messageId, {
      poll: { ...message.poll, closedAt: new Date() },
    });

    return toMessage(updated, userId);
  },

  async react(userId: string, messageId: string, emoji: string, add: boolean, burst = false) {
    const message = await messageRepository.findById(messageId);
    if (!message || message.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    const { context } = await accessService.requireChannelAccess(userId, message.channelId);
    if (add && context && !has(context.permissions, "ADD_REACTIONS")) {
      throw new ForbiddenError("Você não pode reagir neste canal");
    }

    if (add) await reactionRepository.add(messageId, userId, emoji, burst);
    else await reactionRepository.remove(messageId, userId, emoji);

    return { channelId: message.channelId, reactions: await messageService.reactionsOf(messageId) };
  },

  async whoReacted(userId: string, messageId: string) {
    const message = await messageRepository.findById(messageId);
    if (!message) throw new NotFoundError("Mensagem não encontrada");

    await accessService.requireChannelAccess(userId, message.channelId);

    const rows = await reactionRepository.findManyByMessageWithUser(messageId);
    const grouped = new Map<string, ReactionPeople>();

    for (const row of rows) {
      const entry = grouped.get(row.emoji) ?? { emoji: row.emoji, count: 0, users: [] };

      entry.count += 1;
      if (entry.users.length < WHO_REACTED_LIMIT) entry.users.push(toPublicUser(row.user));

      grouped.set(row.emoji, entry);
    }

    return [...grouped.values()];
  },

  async reactionsOf(messageId: string) {
    const rows = await reactionRepository.findManyByMessage(messageId);
    const grouped = new Map<string, { userIds: string[]; burst: boolean }>();

    for (const r of rows) {
      const entry = grouped.get(r.emoji) ?? { userIds: [], burst: false };
      entry.userIds.push(r.userId);
      if (r.burst) entry.burst = true;
      grouped.set(r.emoji, entry);
    }

    return [...grouped.entries()].map(([emoji, v]) => ({ emoji, userIds: v.userIds, burst: v.burst }));
  },

  async markRead(userId: string, channelId: string, messageId: string) {
    await accessService.requireChannelAccess(userId, channelId);
    await readStateRepository.markRead(userId, channelId, messageId);
  },

  async markServerRead(userId: string, guildId: string) {
    const channels = await accessService.readableChannels(userId, guildId);
    const read: { channelId: string; messageId: string }[] = [];

    for (const channelId of channels) {
      const last = await readStateRepository.findLastIn(channelId);
      if (!last) continue;

      await readStateRepository.markRead(userId, channelId, last.id);
      read.push({ channelId: channelId, messageId: last.id });
    }

    return read;
  },

  async markUnread(userId: string, channelId: string, messageId: string) {
    await accessService.requireChannelAccess(userId, channelId);

    const anterior = await messageRepository.findPreviousIn(channelId, messageId);
    await readStateRepository.markRead(userId, channelId, anterior?.id ?? null);
  },

  async mentions(userId: string) {
    const [guildIds, dms] = await Promise.all([
      memberRepository.guildIdsOf(userId),
      dmRepository.findManyForUser(userId),
    ]);

    const serverChannels = await channelRepository.idsByGuilds(guildIds.map((g) => g.guildId));
    const channelIds = [...serverChannels.map((c) => c.id), ...dms.map((d) => d.id)];
    if (!channelIds.length) return [];

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const messages = await messageRepository.findMentions(userId, channelIds, since);

    const channels = await channelRepository.findManyByIds([
      ...new Set(messages.map((m) => m.channelId)),
    ]);
    const byChannel = new Map(channels.map((c) => [c.id, c]));

    return messages.map((m) => ({
      ...toMessage(m, userId),
      channel: {
        id: m.channelId,
        name: byChannel.get(m.channelId)?.name ?? "conversa",
        guildId: byChannel.get(m.channelId)?.guildId ?? null,
      },
    }));
  },

  async readStates(userId: string) {
    const states = await readStateRepository.findManyByUser(userId);

    const memberships = await memberRepository.membershipsOf(userId);
    const mineRoles = [...new Set(memberships.flatMap((m) => m.roleIds))];

    const channels = await channelRepository.guildIdsOf(states.map((s) => s.channelId));
    const channelData = new Map(channels.map((c) => [c.id, c]));

    const read = await Promise.all(
      states.map(async (s) => ({
        channelId: s.channelId,
        guildId: channelData.get(s.channelId)?.guildId ?? null,
        channelName: channelData.get(s.channelId)?.name ?? null,
        lastReadMessageId: s.lastReadMessageId,
        unreadCount: s.lastReadMessageId
          ? await readStateRepository.countUnread(s.channelId, s.lastReadMessageId)
          : 0,
        mentionCount: s.lastReadMessageId
          ? await readStateRepository.countMentions(
              s.channelId,
              s.lastReadMessageId,
              userId,
              mineRoles,
            )
          : 0,
      })),
    );

    const never = await mentionsChannelNeverIsOpen(
      userId,
      new Set(states.map((s) => s.channelId)),
      memberships,
      mineRoles,
    );

    return [...read, ...never];
  },

  get pageSize() {
    return LIMITS.messagePageSize;
  },
};

async function mentionsChannelNeverIsOpen(
  userId: string,
  alreadyHasState: Set<string>,
  memberships: { guildId: string; roleIds: string[]; joinedAt: Date }[],
  mineRoles: string[],
) {
  if (!memberships.length) return [];

  const visible = await accessService.listenableChannels(
    userId,
    memberships.map((m) => m.guildId),
  );

  const fresh = visible.filter((id) => !alreadyHasState.has(id));
  if (!fresh.length) return [];

  const channels = await channelRepository.guildIdsOf(fresh);
  const entry = new Map(memberships.map((m) => [m.guildId, m.joinedAt]));

  const byServer = new Map<string, string[]>();
  for (const channel of channels) {
    if (!channel.guildId || !entry.has(channel.guildId)) continue;
    byServer.set(channel.guildId, [...(byServer.get(channel.guildId) ?? []), channel.id]);
  }

  const counts = await Promise.all(
    [...byServer].map(([guildId, ids]) =>
      readStateRepository.mentionsSince(ids, entry.get(guildId)!, userId, mineRoles),
    ),
  );

  const byId = new Map(channels.map((c) => [c.id, c]));

  return counts.flatMap((partial) =>
    [...partial].map(([channelId, mentionCount]) => ({
      channelId,
      guildId: byId.get(channelId)?.guildId ?? null,
      channelName: byId.get(channelId)?.name ?? null,
      lastReadMessageId: null as string | null,
      unreadCount: 0,
      mentionCount,
    })),
  );
}

function timeoutRequireNotThis(context: Context) {
  const until = context.member?.timeoutUntil;
  if (!until || until <= new Date()) return;

  const minutes = Math.ceil((until.getTime() - Date.now()) / 60_000);
  throw new ForbiddenError(`Você está de castigo neste servidor por mais ${minutes} min`).having("castigo");
}

async function respectModeSlow(
  userId: string,
  channel: { id: string; slowmodeSeconds: number },
  context: Context,
) {
  if (!channel.slowmodeSeconds) return;

  if (
    has(context.permissions, "BYPASS_SLOWMODE") ||
    has(context.permissions, "MANAGE_MESSAGES") ||
    has(context.permissions, "MANAGE_CHANNELS")
  ) {
    return;
  }

  const key = keys.slowmode(channel.id, userId);
  const first = await redis.set(key, "1", "EX", channel.slowmodeSeconds, "NX");

  if (!first) {
    const missing = await redis.ttl(key);
    throw new AppError(`Modo lento: espere ${Math.max(missing, 1)}s para mandar de novo`, 429).having("modo-lento");
  }
}

const isMedia = (contentType: string) =>
  contentType.startsWith("image/") || contentType.startsWith("video/");

async function verifiedRequireEmail(
  userId: string,
  guild: { verifiedRequiresEmail: boolean | null } | null,
  context: Context,
) {
  if (context.isOwner || context.member?.roleIds?.length) return;
  if (!guild?.verifiedRequiresEmail) return;

  const user = await userRepository.findById(userId);
  if (user?.isBot || user?.emailVerifiedAt) return;

  throw new ForbiddenError(
    "Esta comunidade só deixa falar quem confirmou o e-mail. Confirme o seu nas configurações da conta.",
  ).having("recusada");
}

async function ensureFlow(userId: string) {
  const key = keys.messagesFlow(userId);

  const uses = await redis.incr(key);
  if (uses === 1) await redis.expire(key, FLOW_S_WINDOW);

  if (flowPassed(uses)) {
    throw new AppError(flowMessage(await redis.ttl(key)), 429).having("depressa");
  }
}

function buildPoll(input: NonNullable<SendMessageInput["poll"]>) {
  return {
    question: input.question.trim(),
    options: input.options.map((o) => ({
      id: randomUUID(),
      text: o.text.trim(),
      emoji: o.emoji ?? null,
      userIds: [],
    })),
    multiSelect: input.multiSelect ?? false,
    expiresAt: input.durationHours ? new Date(Date.now() + input.durationHours * 3600_000) : null,
    closedAt: null,
  };
}
