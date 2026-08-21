import type { FriendshipModel } from "~/@core/domain/models/friend-model";
import { api } from "~/@core/lib/api";

export async function findFriends(): Promise<FriendshipModel[]> {
  const response = await api.get<FriendshipModel[]>("/friends");
  return response.data;
}
