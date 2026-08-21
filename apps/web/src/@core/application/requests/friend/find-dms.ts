import type { DmChannelModel } from "~/@core/domain/models/friend-model";
import { api } from "~/@core/lib/api";

export async function findDms(): Promise<DmChannelModel[]> {
  const response = await api.get<DmChannelModel[]>("/dms");
  return response.data;
}
