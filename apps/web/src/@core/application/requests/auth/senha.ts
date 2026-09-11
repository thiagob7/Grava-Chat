import type { JoinDto, RegisterDto, SwapPasswordDto } from "~/@core/domain/dtos/auth-dto";
import type { SessionModel } from "~/@core/domain/models/user-model";
import { api, setAccessToken } from "~/@core/lib/api";

export async function register(data: RegisterDto): Promise<SessionModel> {
  const response = await api.post<SessionModel>("/auth/registrar", data);
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function join(data: JoinDto): Promise<SessionModel> {
  const response = await api.post<SessionModel>("/auth/entrar", data);
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function swapPassword(data: SwapPasswordDto): Promise<void> {
  await api.put("/auth/senha", data);
}

export async function requestPasswordNew(email: string): Promise<void> {
  await api.post("/auth/esqueci", { email });
}

export async function resetPassword(data: { token: string; password: string }): Promise<void> {
  await api.post("/auth/redefinir", data);
}

export async function emailRequestVerification(): Promise<void> {
  await api.post("/auth/verificar-email");
}

export async function confirmEmail(token: string): Promise<void> {
  await api.post("/auth/verificar-email/confirmar", { token });
}
