import type { DevLoginDTO } from "~/@core/domain/dtos/auth-dto";
import type { SessionModel } from "~/@core/domain/models/user-model";
import { api, setAccessToken } from "~/@core/lib/api";

export async function devLogin(data: DevLoginDTO): Promise<SessionModel> {
  const response = await api.post<SessionModel>("/auth/dev-login", data);
  setAccessToken(response.data.accessToken);
  return response.data;
}
