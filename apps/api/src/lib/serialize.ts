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
  PerfilPublico,
  StatusPersonalizado,
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
  };
}

export type EtiquetaResolvida = { guildId: string; tag: string; tagIcon: string | null };

export function toPerfilPublico(
  u: UserRow,
  emblemas: string[] = [],
  etiquetaDoServidor: EtiquetaResolvida | null = null,
): PerfilPublico {
  const p = u.perfil;

  return {
    ...(p?.nome ? { nome: limparNome(p.nome) } : {}),
    ...(p?.etiqueta ? { etiqueta: p.etiqueta } : {}),
    ...(etiquetaDoServidor ? { etiquetaDoServidor } : {}),
    ...(emblemas.length ? { emblemas } : {}),
    ...(p?.patente ? { patente: p.patente as PerfilPublico["patente"] } : {}),
    ...(p?.decoracao ? { decoracao: p.decoracao as PerfilPublico["decoracao"] } : {}),
    ...(p?.moldura ? { moldura: p.moldura as PerfilPublico["moldura"] } : {}),
    ...(p?.placa ? { placa: p.placa as PerfilPublico["placa"] } : {}),
    ...(statusVigente(u) ? { status: statusVigente(u) } : {}),
  };
}

export function statusVigente(u: UserRow): StatusPersonalizado | null {
  const s = u.statusPersonalizado;
  if (!s) return null;
  if (s.expiraEm && s.expiraEm <= new Date()) return null;

  return {
    texto: s.texto,
    emoji: s.emoji,
    expiraEm: s.expiraEm?.toISOString() ?? null,
  };
}

function limparNome(n: NonNullable<NonNullable<UserRow["perfil"]>["nome"]>) {
  return {
    ...(n.fonte ? { fonte: n.fonte as "padrao" } : {}),
    ...(n.efeito ? { efeito: n.efeito as "solido" } : {}),
    ...(n.cor ? { cor: n.cor } : {}),
    ...(n.cor2 ? { cor2: n.cor2 } : {}),
  };
}

/// Comparação em minúsculas e sem espaço: e-mail digitado no .env com maiúscula
/// ou espaço depois da vírgula é erro fácil de cometer e chato de diagnosticar.
const ADMINS = new Set(
  env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
);

export const ehAdmin = (email: string) => ADMINS.has(email.toLowerCase());

export function toSelfUser(
  u: UserRow,
  providers: string[] = [],
  desiredStatus: DesiredStatus = "ONLINE",
): SelfUser {
  return {
    ...toPublicUser(u),
    email: u.email,
    bio: u.bio,
    providers,
    createdAt: u.createdAt.toISOString(),
    perfil: u.perfil ? (u.perfil as SelfUser["perfil"]) : null,
    statusPersonalizado: statusVigente(u),
    desiredStatus,
    admin: ehAdmin(u.email),
    aceitaPedidos: u.aceitaPedidos,
    mostraAtividade: u.mostraAtividade,
    mostraServidoresEmComum: u.mostraServidoresEmComum,
    mostraAmigosEmComum: u.mostraAmigosEmComum,
    excluirEm: u.excluirEm ? u.excluirEm.toISOString() : null,
  };
}

export function toChannel(c: Prisma.ChannelGetPayload<object>): Channel {
  return {
    id: c.id,
    guildId: c.guildId,
    categoryId: c.categoryId,
    name: c.name,
    fonte: (c.fonte ?? null) as Channel["fonte"],
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
    colorSecondary: r.colorSecondary,
    iconUrl: r.iconUrl,
    iconEmoji: r.iconEmoji,
    estilo: (r.estilo as Role["estilo"]) ?? "solido",
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

export function toMessage(m: MessageRow, viewerId: string): Message {
  const grouped = new Map<string, { count: number; me: boolean; burst: boolean }>();

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
    fonte: (m.fonte ?? null) as Message["fonte"],
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

export const notDeleted = unset("deletedAt") satisfies Prisma.MessageWhereInput;
