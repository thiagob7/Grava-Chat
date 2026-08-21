import type { PresenceStatus } from "@gravae/shared";

export interface PublicUserModel {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: PresenceStatus;
}

export interface SelfUserModel extends PublicUserModel {
  email: string;
  bio: string | null;
  /** provedores ligados à conta ("google"); vazio = entrou pelo dev-login */
  providers: string[];
  createdAt: string;
}

export interface SessionModel {
  accessToken: string;
  user: SelfUserModel;
}

export interface AuthConfigModel {
  devLogin: boolean;
  google: boolean;
  /** endereço do SFU; o front usa pra saber se consegue alcançá-lo daqui */
  voiceUrl: string;
}
