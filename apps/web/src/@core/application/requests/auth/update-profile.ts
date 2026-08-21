import type { UpdateProfileDTO } from "~/@core/domain/dtos/auth-dto";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { api } from "~/@core/lib/api";

export async function updateProfile(data: UpdateProfileDTO): Promise<SelfUserModel> {
  const response = await api.patch<SelfUserModel>("/me", data);
  return response.data;
}
