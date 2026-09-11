import { api } from "~/@core/lib/api";

export async function saveNote(userId: string, text: string): Promise<{ note: string | null }> {
  const reply = await api.put<{ note: string | null }>(`/users/${userId}/nota`, { text });
  return reply.data;
}
