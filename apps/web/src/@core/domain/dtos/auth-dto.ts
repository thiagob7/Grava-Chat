import type { EstiloDePerfil, StatusPersonalizado } from "@gravae/shared";

export interface DevLoginDTO {
  email: string;
  displayName?: string;
}

export interface UpdateProfileDTO {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  /** `null` = voltar ao padrão; o servidor apaga o documento embutido */
  perfil?: EstiloDePerfil | null;
  statusPersonalizado?: StatusPersonalizado | null;
}

/** O que o aplicativo de desktop apresenta pra fechar o login com Google. */
export interface DesktopLoginDTO {
  codigo: string;
  verificador: string;
}
