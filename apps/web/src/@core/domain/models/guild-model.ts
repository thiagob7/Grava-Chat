import type {
  Category,
  Channel,
  GuildMember,
  Permission,
  PublicUser,
  Role,
  VoiceState,
} from "@gravae/shared";

export interface GuildModel {
  id: string;
  name: string;
  iconUrl: string | null;
  description?: string | null;
  /** etiqueta de até 4 letras ao lado do nome de quem é membro */
  tag?: string | null;
  tagIcon?: string | null;
  systemChannelId?: string | null;
  welcomeEnabled?: boolean;
  ownerId: string;
  memberCount: number;
}

export interface GuildInviteModel {
  id: string;
  code: string;
  inviter: PublicUser;
  uses: number;
  maxUses: number | null;
  expiresAt: string | null;
  createdAt: string;
  /** vencido ou esgotado: continua na lista, mas marcado */
  expired: boolean;
}

/** O que a lista lateral precisa: o servidor mais o que VOCÊ pode nele. */
export interface GuildSummaryModel extends GuildModel {
  isOwner: boolean;
  permissions: Permission[];
}

export interface RoleModel extends Role {
  /** quantas pessoas têm este cargo; ausente no @everyone, que é todo mundo */
  memberCount?: number;
}

export interface WebhookModel {
  id: string;
  guildId: string;
  channelId: string;
  name: string;
  avatarUrl: string | null;
  /** a URL inteira, pronta pra colar em quem vai postar — trate como senha */
  url: string;
  /** o usuário-bot que assina as mensagens */
  bot: PublicUser;
  createdBy: PublicUser;
  createdAt: string;
}

export interface OverwriteModel {
  channelId: string;
  targetId: string;
  type: "ROLE" | "MEMBER";
  allow: Permission[];
  deny: Permission[];
}

export type ChannelWithLastMessageModel = Channel & { lastMessageId: string | null };

export interface GuildDetailModel {
  guild: GuildModel;
  /** o que EU posso neste servidor */
  permissions: Permission[];
  /** e o que eu posso em cada canal, que pode divergir do geral */
  channelPermissions: Record<string, Permission[]>;
  roles: Role[];
  categories: Category[];
  channels: ChannelWithLastMessageModel[];
  members: GuildMember[];
  voiceStates: Record<string, VoiceState[]>;
}

export interface InviteModel {
  code: string;
  expiresAt: string | null;
  maxUses: number | null;
}

export interface InvitePreviewModel {
  code: string;
  guild: Pick<GuildModel, "id" | "name" | "iconUrl" | "memberCount">;
  inviter: string;
  alreadyMember: boolean;
}
