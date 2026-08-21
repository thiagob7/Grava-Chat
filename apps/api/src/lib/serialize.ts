import type { Prisma } from "@prisma/client";
import type {
  Message,
  PublicUser,
  SelfUser,
  Channel,
  GuildMember,
  Role,
  Sticker,
  GuildEmoji,
  GuildSound,
} from "@gravae/shared";
import { unset } from "./mongo.js";

type UserRow = Prisma.UserGetPayload<object>;

/**
 * O User do banco tem email. Toda resposta que sai pra outros membros passa
 * por aqui — e o unico lugar que decide o que e publico.
 */
export function toPublicUser(u: UserRow): PublicUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    status: u.status,
  };
}

export function toSelfUser(u: UserRow, providers: string[] = []): SelfUser {
  return {
    ...toPublicUser(u),
    email: u.email,
    bio: u.bio,
    providers,
    createdAt: u.createdAt.toISOString(),
  };
}

export function toChannel(c: Prisma.ChannelGetPayload<object>): Channel {
  return {
    id: c.id,
    guildId: c.guildId,
    categoryId: c.categoryId,
    name: c.name,
    type: c.type,
    topic: c.topic,
    position: c.position,
    isPrivate: c.isPrivate,
    slowmodeSeconds: c.slowmodeSeconds,
    contentVisibility: c.contentVisibility,
    bitrate: c.bitrate,
    videoQuality: c.videoQuality,
    userLimit: c.userLimit,
  };
}

export function toRole(r: Prisma.RoleGetPayload<object>): Role {
  return {
    id: r.id,
    guildId: r.guildId,
    name: r.name,
    color: r.color,
    position: r.position,
    permissions: r.permissions,
    hoist: r.hoist,
    mentionable: r.mentionable,
    isEveryone: r.isEveryone,
  };
}

export function toMember(m: Prisma.GuildMemberGetPayload<{ include: { user: true } }>): GuildMember {
  return {
    id: m.id,
    guildId: m.guildId,
    user: toPublicUser(m.user),
    roleIds: m.roleIds,
    nickname: m.nickname,
    timeoutUntil: m.timeoutUntil?.toISOString() ?? null,
    joinedAt: m.joinedAt.toISOString(),
  };
}

type MessageRow = Prisma.MessageGetPayload<{
  include: { author: true; reactions: true; sticker: true };
}>;

/**
 * As reacoes vem do banco como uma linha por (usuario, emoji) e o front quer
 * o agrupado com "eu ja reagi?". O `viewerId` e o que permite montar isso sem
 * um request extra por mensagem.
 */
export function toMessage(m: MessageRow, viewerId: string): Message {
  const grouped = new Map<string, { count: number; me: boolean }>();

  for (const r of m.reactions) {
    const entry = grouped.get(r.emoji) ?? { count: 0, me: false };
    entry.count += 1;
    if (r.userId === viewerId) entry.me = true;
    grouped.set(r.emoji, entry);
  }

  return {
    id: m.id,
    channelId: m.channelId,
    author: toPublicUser(m.author),
    content: m.content,
    tipo: m.tipo,
    attachments: m.attachments.map((a) => ({
      id: a.id,
      url: a.url,
      filename: a.filename,
      contentType: a.contentType,
      size: a.size,
      width: a.width,
      height: a.height,
      spoiler: a.spoiler,
      description: a.description,
    })),
    poll: m.poll
      ? {
          pergunta: m.poll.pergunta,
          opcoes: m.poll.opcoes.map((o) => ({
            id: o.id,
            texto: o.texto,
            emoji: o.emoji,
            userIds: o.userIds,
          })),
          multiSelect: m.poll.multiSelect,
          expiresAt: m.poll.expiresAt?.toISOString() ?? null,
          closedAt: m.poll.closedAt?.toISOString() ?? null,
        }
      : null,
    sticker: m.sticker ? toSticker(m.sticker) : null,
    reactions: [...grouped.entries()].map(([emoji, v]) => ({ emoji, count: v.count, me: v.me })),
    replyToId: m.replyToId,
    postId: m.postId,
    pinnedAt: m.pinnedAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    editedAt: m.editedAt?.toISOString() ?? null,
  };
}

export function toSticker(s: Prisma.GuildStickerGetPayload<object>): Sticker {
  return {
    id: s.id,
    guildId: s.guildId,
    name: s.name,
    description: s.description,
    relatedEmoji: s.relatedEmoji,
    url: s.url,
  };
}

export function toGuildEmoji(e: Prisma.GuildEmojiGetPayload<object>): GuildEmoji {
  return { id: e.id, guildId: e.guildId, name: e.name, url: e.url, animated: e.animated };
}

export function toGuildSound(s: Prisma.GuildSoundGetPayload<object>): GuildSound {
  return { id: s.id, guildId: s.guildId, name: s.name, emoji: s.emoji, url: s.url, volume: s.volume };
}

export const messageInclude = {
  author: true,
  reactions: true,
  sticker: true,
} satisfies Prisma.MessageInclude;

/** Mensagens nao apagadas. Ver a nota em lib/mongo.ts sobre null vs ausente. */
export const notDeleted = unset("deletedAt") satisfies Prisma.MessageWhereInput;
