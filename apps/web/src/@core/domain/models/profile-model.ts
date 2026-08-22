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
  /**
   * O enfeite COMPLETO — inclusive banner, tema e efeito, que não viajam no
   * mapa `profiles` do servidor. Aqui é uma pessoa por vez, então não há
   * repetição a evitar; e é o que faz o cartão funcionar numa DM, onde não
   * existe servidor de onde tirar mapa.
   */
  perfil: EstiloDePerfil | null;
  /** a etiqueta de servidor que esta pessoa escolheu vestir, já resolvida */
  etiquetaDoServidor: { guildId: string; tag: string; tagIcon: string | null } | null;
  statusPersonalizado: StatusPersonalizado | null;
  createdAt: string;
  friendship: ProfileFriendship;
  /** id da relação, para aceitar ou desfazer direto do perfil */
  friendshipId: string | null;
  mutualGuilds: number;
  mutualFriends: number;
  /**
   * A SUA anotação sobre esta pessoa. Só quem escreveu recebe — quem é descrito
   * nunca vê nada, e é isso que a torna útil pra "amigo do Leo" e pra "cuidado".
   */
  nota: string | null;
}
