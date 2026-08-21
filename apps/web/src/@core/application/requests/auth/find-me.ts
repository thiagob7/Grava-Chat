import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { api } from "~/@core/lib/api";

export async function findMe(): Promise<SelfUserModel> {
  const response = await api.get<SelfUserModel>("/me");
  return response.data;
}
