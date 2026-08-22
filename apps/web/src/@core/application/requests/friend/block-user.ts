import { api } from "~/@core/lib/api";

export async function blockUser(userId: string): Promise<void> {
  await api.post("/friends/block", { userId });
}

export async function unblockUser(userId: string): Promise<void> {
  await api.delete(`/friends/block/${userId}`);
}
