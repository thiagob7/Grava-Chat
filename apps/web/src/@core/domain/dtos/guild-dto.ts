import type { ChannelType } from "@gravae/shared";

export interface CreateGuildDTO {
  name: string;
}

export interface CreateChannelDTO {
  guildId: string;
  name: string;
  type: ChannelType;
  categoryId?: string | null;
  topic?: string | null;
  isPrivate?: boolean;
}

export interface CreateInviteDTO {
  guildId: string;
  maxUses?: number | null;
  expiresInHours?: number | null;
}
