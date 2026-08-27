import { api } from "~/@core/lib/api";
import type { PublicUserModel } from "~/@core/domain/models/user-model";

export interface AmigoAtivo {
  user: PublicUserModel;
  canal: { id: string; nome: string };
  servidor: { id: string; nome: string; iconUrl: string | null };
}

export async function findAtivos(): Promise<AmigoAtivo[]> {
  const response = await api.get<AmigoAtivo[]>("/friends/ativos");
  return response.data;
}
