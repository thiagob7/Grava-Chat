import type { PublicUser } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export interface InCommonModel {
  friends: PublicUser[];
  servers: { id: string; name: string; iconUrl: string | null }[];
}

export async function findCommon(userId: string): Promise<InCommonModel> {
  const response = await api.get<InCommonModel>(`/users/${userId}/em-comum`);
  return response.data;
}
