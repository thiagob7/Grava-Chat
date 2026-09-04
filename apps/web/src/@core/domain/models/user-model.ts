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
  admin: boolean;

  aceitaPedidos: boolean;
  mostraAtividade: boolean;
  mostraServidoresEmComum: boolean;
  mostraAmigosEmComum: boolean;

  excluirEm: string | null;
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
