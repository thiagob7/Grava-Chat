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
  ProfilePublic,
  CustomStatus,
  DesiredStatus,
} from "@gravae/shared";
import { env } from "~/env.js";
import { unset } from "./mongo.js";

type UserRow = Prisma.UserGetPayload<object>;

export function toPublicUser(u: UserRow): PublicUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    status: u.status,
    isBot: u.isBot,
    ...(u.system ? { system: true } : {}),
  };
}

export type TagResolved = {
  guildId: string;
  tag: string;
  tagIcon: string | null;
};

export function toProfilePublic(
  u: UserRow,
  badges: string[] = [],
  serverTag: TagResolved | null = null,
): ProfilePublic {
  const p = u.profile;

  return {
    ...(p?.name ? { name: clearName(p.name) } : {}),
    ...(p?.tag ? { tag: p.tag } : {}),
    ...(serverTag ? { serverTag } : {}),
    ...(badges.length ? { badges } : {}),
    ...(p?.rank ? { rank: p.rank as ProfilePublic["rank"] } : {}),
    ...(p?.decoration
      ? { decoration: p.decoration as ProfilePublic["decoration"] }
      : {}),
    ...(p?.frame ? { frame: p.frame as ProfilePublic["frame"] } : {}),
    ...(p?.plate ? { plate: p.plate as ProfilePublic["plate"] } : {}),
    ...(currentStatus(u) ? { status: currentStatus(u) } : {}),
    ...(p?.connections?.length
      ? { connections: p.connections as NonNullable<ProfilePublic["connections"]> }
      : {}),
  };
}

export function currentStatus(u: UserRow): CustomStatus | null {
  const s = u.customStatus;
  if (!s) return null;
  if (s.expiresAt && s.expiresAt <= new Date()) return null;

  return {
    text: s.text,
    emoji: s.emoji,
    expiresAt: s.expiresAt?.toISOString() ?? null,
  };
}

function clearName(n: NonNullable<NonNullable<UserRow["profile"]>["name"]>) {
  return {
    ...(n.font ? { font: n.font as "padrao" } : {}),
    ...(n.effect ? { effect: n.effect as "solido" } : {}),
    ...(n.color ? { color: n.color } : {}),
    ...(n.color2 ? { color2: n.color2 } : {}),
  };
}

export const ADMINS = new Set(
  env.ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export const isAdmin = (email: string) => ADMINS.has(email.toLowerCase());

export function toSelfUser(
  u: UserRow,
  providers: string[] = [],
  desiredStatus: DesiredStatus = "ONLINE",
): SelfUser {
  return {
    ...toPublicUser(u),
    email: u.email,
    bio: u.bio,
    pronouns: u.pronouns,
    providers,
    createdAt: u.createdAt.toISOString(),
    profile: u.profile ? (u.profile as SelfUser["profile"]) : null,
    customStatus: currentStatus(u),
    desiredStatus,
    admin: isAdmin(u.email),
    acceptedRequests: u.acceptedRequests,
    showsActivity: u.showsActivity,
    membersAllowDm: u.membersAllowDm,
    spamFilter: u.spamFilter,
    showsServersCommon: u.showsServersCommon,
    showsFriendsCommon: u.showsFriendsCommon,
    deleteAt: u.deleteAt ? u.deleteAt.toISOString() : null,
    verifiedEmail: Boolean(u.emailVerifiedAt),
  };
}

export function toChannel(c: Prisma.ChannelGetPayload<object>): Channel {
  return {
    id: c.id,
    guildId: c.guildId,
    categoryId: c.categoryId,
    name: c.name,
    font: (c.font ?? null) as Channel["font"],
    type: c.type,
    url: c.url,
    topic: c.topic,
    position: c.position,
    isPrivate: c.isPrivate,
    slowmodeSeconds: c.slowmodeSeconds,
    contentVisibility: c.contentVisibility,
    status: c.status,
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
    colorSecondary: r.colorSecondary,
    iconUrl: r.iconUrl,
    iconEmoji: r.iconEmoji,
    style: (r.style as Role["style"]) ?? "solido",
    position: r.position,
    permissions: r.permissions,
    hoist: r.hoist,
    mentionable: r.mentionable,
    isEveryone: r.isEveryone,
  };
}

export function toMember(
  m: Prisma.GuildMemberGetPayload<{ include: { user: true } }>,
): GuildMember {
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

export function toMessage(m: MessageRow, viewerId: string): Message {
  const grouped = new Map<
    string,
    { count: number; me: boolean; burst: boolean }
  >();

  for (const r of m.reactions) {
    const entry = grouped.get(r.emoji) ?? { count: 0, me: false, burst: false };
    entry.count += 1;
    if (r.userId === viewerId) entry.me = true;
    if (r.burst) entry.burst = true;
    grouped.set(r.emoji, entry);
  }

  return {
    id: m.id,
    channelId: m.channelId,
    author: toPublicUser(m.author),
    content: m.content,
    font: (m.font ?? null) as Message["font"],
    kind: m.kind,
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
      durationMs: a.durationMs,
      waves: a.waves,
    })),
    poll: m.poll
      ? {
          question: m.poll.question,
          options: m.poll.options.map((o) => ({
            id: o.id,
            text: o.text,
            emoji: o.emoji,
            userIds: o.userIds,
          })),
          multiSelect: m.poll.multiSelect,
          expiresAt: m.poll.expiresAt?.toISOString() ?? null,
          closedAt: m.poll.closedAt?.toISOString() ?? null,
        }
      : null,
    sticker: m.sticker ? toSticker(m.sticker) : null,
    reactions: [...grouped.entries()].map(([emoji, v]) => ({
      emoji,
      count: v.count,
      me: v.me,
      burst: v.burst,
    })),
    mentions: m.mentions,
    mentionRoleIds: m.mentionRoleIds,
    mentionEveryone: m.mentionEveryone ?? false,
    replyToId: m.replyToId,
    forwarded:
      m.channelForwardedId && m.messageForwardedId
        ? { channelId: m.channelForwardedId, messageId: m.messageForwardedId }
        : null,
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

export function toGuildEmoji(
  e: Prisma.GuildEmojiGetPayload<object>,
): GuildEmoji {
  return {
    id: e.id,
    guildId: e.guildId,
    name: e.name,
    url: e.url,
    animated: e.animated,
  };
}

export function toGuildSound(
  s: Prisma.GuildSoundGetPayload<object>,
): GuildSound {
  return {
    id: s.id,
    guildId: s.guildId,
    name: s.name,
    emoji: s.emoji,
    url: s.url,
    volume: s.volume,
  };
}

export const messageInclude = {
  author: true,
  reactions: true,
  sticker: true,
} satisfies Prisma.MessageInclude;

export const notDeleted = unset("deletedAt") satisfies Prisma.MessageWhereInput;
