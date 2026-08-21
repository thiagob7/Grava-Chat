import type { ProfileModel } from "~/@core/domain/models/profile-model";
import { api } from "~/@core/lib/api";

export async function findProfile(userId: string): Promise<ProfileModel> {
  const response = await api.get<ProfileModel>(`/users/${userId}`);
  return response.data;
}
