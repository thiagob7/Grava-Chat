import type { DesktopLoginDTO } from "~/@core/domain/dtos/auth-dto";
import type { SessionModel } from "~/@core/domain/models/user-model";
import { api, setAccessToken } from "~/@core/lib/api";

/**
 * Fecha o login que começou no navegador do sistema: troca o código de uso
 * único (que chegou por `gravae://`) pela sessão de verdade. É esta chamada que
 * grava o cookie httpOnly — na janela do aplicativo, e não no navegador.
 */
export async function desktopLogin(data: DesktopLoginDTO): Promise<SessionModel> {
  const response = await api.post<SessionModel>("/auth/desktop/trocar", data);
  setAccessToken(response.data.accessToken);
  return response.data;
}
