import type { EstiloDePerfil, PublicUser, StatusPersonalizado } from "@gravae/shared";

export type ProfileFriendship =
  | "SELF"
  | "NONE"
  | "ACCEPTED"
  | "PENDING_IN"
  | "PENDING_OUT"
  | "BLOCKED";

export interface ProfileModel extends PublicUser {
  bio: string | null;
  perfil: EstiloDePerfil | null;
  etiquetaDoServidor: { guildId: string; tag: string; tagIcon: string | null } | null;
  statusPersonalizado: StatusPersonalizado | null;
  createdAt: string;
  friendship: ProfileFriendship;
  friendshipId: string | null;
  mutualGuilds: number;
  mutualFriends: number;
  nota: string | null;
}
