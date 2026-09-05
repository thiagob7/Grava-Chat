import type {
  CategoriaDeComunidade,
  Category,
  Channel,
  Emblema,
  GuildMember,
  PerfilPublico,
  Permission,
  PublicUser,
  Role,
  VoiceState,
} from "@gravae/shared";

export interface GuildModel {
  id: string;
  name: string;
  iconUrl: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  tag?: string | null;
  tagIcon?: string | null;
  systemChannelId?: string | null;
  welcomeEnabled?: boolean;
  welcomeMessage?: string | null;
  categoria?: CategoriaDeComunidade | null;
  descobrivel?: boolean | null;
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
  expired: boolean;
}

export interface GuildSummaryModel extends GuildModel {
  isOwner: boolean;
  permissions: Permission[];
}

export interface RoleModel extends Role {
  memberCount?: number;
}

export interface WebhookModel {
  id: string;
  guildId: string;
  channelId: string;
  name: string;
  avatarUrl: string | null;
  url: string;
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
  permissions: Permission[];
  channelPermissions: Record<string, Permission[]>;
  roles: Role[];
  categories: Category[];
  channels: ChannelWithLastMessageModel[];
  members: GuildMember[];
  profiles: Record<string, PerfilPublico>;
  emblemas: Emblema[];
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
