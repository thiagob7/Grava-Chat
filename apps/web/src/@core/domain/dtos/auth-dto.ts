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

  aceitaPedidos?: boolean;
  mostraAtividade?: boolean;
  mostraServidoresEmComum?: boolean;
  mostraAmigosEmComum?: boolean;
}

export interface DesktopLoginDTO {
  codigo: string;
  verificador: string;
}
