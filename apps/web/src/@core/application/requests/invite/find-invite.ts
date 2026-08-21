import type { InvitePreviewModel } from "~/@core/domain/models/guild-model";
import { api } from "~/@core/lib/api";

export async function findInvite(code: string): Promise<InvitePreviewModel> {
  const response = await api.get<InvitePreviewModel>(`/invites/${code}`);
  return response.data;
}
