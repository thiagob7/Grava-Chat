import type { Channel } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export async function openDm(userId: string): Promise<Channel> {
  const response = await api.post<Channel>("/dms", { userId });
  return response.data;
}
