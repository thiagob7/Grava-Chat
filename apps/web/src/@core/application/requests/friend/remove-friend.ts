import { api } from "~/@core/lib/api";

export async function removeFriend(friendshipId: string): Promise<void> {
  await api.delete(`/friends/${friendshipId}`);
}
