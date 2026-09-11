import { api } from "~/@core/lib/api";
import type { PublicUserModel } from "~/@core/domain/models/user-model";

export interface ActiveFriend {
  user: PublicUserModel;
  channel: { id: string; name: string };
  server: { id: string; name: string; iconUrl: string | null };
}

export async function findActive(): Promise<ActiveFriend[]> {
  const response = await api.get<ActiveFriend[]>("/friends/ativos");
  return response.data;
}
