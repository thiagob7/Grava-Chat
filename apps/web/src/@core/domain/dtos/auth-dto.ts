export interface DevLoginDTO {
  email: string;
  displayName?: string;
}

export interface UpdateProfileDTO {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

/** O que o aplicativo de desktop apresenta pra fechar o login com Google. */
export interface DesktopLoginDTO {
  codigo: string;
  verificador: string;
}
