import { api } from "~/@core/lib/api";

export async function requestFriend(username: string): Promise<{ aceitou: boolean }> {
  const response = await api.post<{ aceitou: boolean }>("/friends", { username });
  return response.data;
}
