import type { DesktopLoginDTO } from "~/@core/domain/dtos/auth-dto";
import type { SessionModel } from "~/@core/domain/models/user-model";
import { api, setAccessToken } from "~/@core/lib/api";

export async function desktopLogin(data: DesktopLoginDTO): Promise<SessionModel> {
  const response = await api.post<SessionModel>("/auth/desktop/trocar", data);
  setAccessToken(response.data.accessToken);
  return response.data;
}
