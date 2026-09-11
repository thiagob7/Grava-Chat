import { api } from "~/@core/lib/api";

import type { PublicUserModel } from "~/@core/domain/models/user-model";

export interface AppAuthorizedModel {
  id: string;
  user: PublicUserModel;
  description: string | null;
  scopes: string[];
  authorizedAt: string | null;
  expiresAt: string | null;
}

export async function findAppsAuthorized(): Promise<AppAuthorizedModel[]> {
  const response = await api.get<AppAuthorizedModel[]>("/me/aplicativos");
  return response.data;
}

export async function revokeApp(botId: string): Promise<void> {
  await api.delete(`/me/aplicativos/${botId}`);
}
