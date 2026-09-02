import type { PublicUser } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export interface EmComumModel {
  amigos: PublicUser[];
  servidores: { id: string; name: string; iconUrl: string | null }[];
}

export async function findEmComum(userId: string): Promise<EmComumModel> {
  const response = await api.get<EmComumModel>(`/users/${userId}/em-comum`);
  return response.data;
}
