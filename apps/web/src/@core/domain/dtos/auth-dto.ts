import type { EstiloDePerfil, FiltroDeSpam, StatusPersonalizado } from "@gravae/shared";

export interface DevLoginDTO {
  email: string;
  displayName?: string;
}

export interface UpdateProfileDTO {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  pronomes?: string | null;
  perfil?: EstiloDePerfil | null;
  statusPersonalizado?: StatusPersonalizado | null;

  aceitaPedidos?: boolean;
  mostraAtividade?: boolean;
  mostraServidoresEmComum?: boolean;
  mostraAmigosEmComum?: boolean;
  permitirDmDeMembros?: boolean;
  filtroDeSpam?: FiltroDeSpam;
}

export interface DesktopLoginDTO {
  codigo: string;
  verificador: string;
}

export interface RegistrarDTO {
  email: string;
  senha: string;
  displayName: string;
}

export interface EntrarDTO {
  email: string;
  senha: string;
}

export interface TrocarSenhaDTO {
  atual?: string;
  nova: string;
}
