import type { ProfileStyle, PublicUser, CustomStatus } from "@gravae/shared";

export type ProfileFriendship =
  | "SELF"
  | "NONE"
  | "ACCEPTED"
  | "PENDING_IN"
  | "PENDING_OUT"
  | "BLOCKED";

export interface ProfileModel extends PublicUser {
  bio: string | null;
  pronouns: string | null;
  profile: ProfileStyle | null;
  serverTag: { guildId: string; tag: string; tagIcon: string | null } | null;
  customStatus: CustomStatus | null;
  botId: string | null;
  createdAt: string;
  friendship: ProfileFriendship;
  friendshipId: string | null;
  mutualGuilds: number;
  mutualFriends: number;
  note: string | null;
}
