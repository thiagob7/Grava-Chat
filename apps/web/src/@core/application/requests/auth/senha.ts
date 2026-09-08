import type { EntrarDTO, RegistrarDTO, TrocarSenhaDTO } from "~/@core/domain/dtos/auth-dto";
import type { SessionModel } from "~/@core/domain/models/user-model";
import { api, setAccessToken } from "~/@core/lib/api";

export async function registrar(data: RegistrarDTO): Promise<SessionModel> {
  const response = await api.post<SessionModel>("/auth/registrar", data);
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function entrar(data: EntrarDTO): Promise<SessionModel> {
  const response = await api.post<SessionModel>("/auth/entrar", data);
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function trocarSenha(data: TrocarSenhaDTO): Promise<void> {
  await api.put("/auth/senha", data);
}

export async function pedirSenhaNova(email: string): Promise<void> {
  await api.post("/auth/esqueci", { email });
}

export async function redefinirSenha(data: { token: string; senha: string }): Promise<void> {
  await api.post("/auth/redefinir", data);
}
