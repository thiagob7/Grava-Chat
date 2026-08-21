import type { AuthConfigModel } from "~/@core/domain/models/user-model";
import { api } from "~/@core/lib/api";

export async function findAuthConfig(): Promise<AuthConfigModel> {
  const response = await api.get<AuthConfigModel>("/auth/config");
  return response.data;
}
