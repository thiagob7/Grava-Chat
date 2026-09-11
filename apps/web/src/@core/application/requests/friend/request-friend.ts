import { api } from "~/@core/lib/api";

export async function requestFriend(
  username: string,
  note?: string | null,
): Promise<{ accepted: boolean }> {
  const response = await api.post<{ accepted: boolean }>("/friends", { username, note });
  return response.data;
}
