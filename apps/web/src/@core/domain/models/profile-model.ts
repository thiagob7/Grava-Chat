import type { PublicUser } from "@gravae/shared";

export type ProfileFriendship =
  | "SELF"
  | "NONE"
  | "ACCEPTED"
  | "PENDING_IN"
  | "PENDING_OUT"
  | "BLOCKED";

export interface ProfileModel extends PublicUser {
  bio: string | null;
  createdAt: string;
  friendship: ProfileFriendship;
  /** id da relação, para aceitar ou desfazer direto do perfil */
  friendshipId: string | null;
  mutualGuilds: number;
  mutualFriends: number;
}
