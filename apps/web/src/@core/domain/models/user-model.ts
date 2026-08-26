import type {
  DesiredStatus,
  EstiloDePerfil,
  PresenceStatus,
  StatusPersonalizado,
} from "@gravae/shared";

export interface PublicUserModel {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: PresenceStatus;
  /// conta de bot ou de webhook
  isBot: boolean;
}

export interface SelfUserModel extends PublicUserModel {
  email: string;
  bio: string | null;
  providers: string[];
  createdAt: string;
  perfil: EstiloDePerfil | null;
  statusPersonalizado: StatusPersonalizado | null;
  desiredStatus: DesiredStatus;
}

export interface SessionModel {
  accessToken: string;
  user: SelfUserModel;
}

export interface AuthConfigModel {
  devLogin: boolean;
  google: boolean;
  voiceUrl: string;
}
