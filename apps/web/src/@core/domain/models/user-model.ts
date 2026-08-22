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
}

export interface SelfUserModel extends PublicUserModel {
  email: string;
  bio: string | null;
  /** provedores ligados à conta ("google"); vazio = entrou pelo dev-login */
  providers: string[];
  createdAt: string;
  /**
   * Os enfeites COMPLETOS, inclusive banner, tema e efeito de perfil — os que
   * só aparecem no próprio cartão e não viajam no mapa `profiles` dos outros.
   */
  perfil: EstiloDePerfil | null;
  statusPersonalizado: StatusPersonalizado | null;
  /**
   * O único lugar do app onde `INVISIBLE` existe. Os outros me veem `OFFLINE`;
   * só eu sei que escolhi sumir.
   */
  desiredStatus: DesiredStatus;
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
