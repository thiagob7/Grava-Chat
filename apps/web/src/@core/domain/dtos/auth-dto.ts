import type { EstiloDePerfil, StatusPersonalizado } from "@gravae/shared";

export interface DevLoginDTO {
  email: string;
  displayName?: string;
}

export interface UpdateProfileDTO {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  perfil?: EstiloDePerfil | null;
  statusPersonalizado?: StatusPersonalizado | null;

  /// Privacidade. Vai pelo mesmo `PATCH /me` do resto: são preferências da
  /// conta, e um caminho só de escrita evita dois lugares pra manter.
  aceitaPedidos?: boolean;
  mostraAtividade?: boolean;
  mostraServidoresEmComum?: boolean;
  mostraAmigosEmComum?: boolean;
}

export interface DesktopLoginDTO {
  codigo: string;
  verificador: string;
}
