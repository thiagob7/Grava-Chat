import { api } from "~/@core/lib/api";

export async function respondFriend(friendshipId: string, accept: boolean): Promise<void> {
  await api.post(`/friends/${friendshipId}/respond`, { accept });
}
