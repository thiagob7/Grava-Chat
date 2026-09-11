import { api } from "~/@core/lib/api";

export interface SessionModel {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

export async function findSessions(): Promise<SessionModel[]> {
  const response = await api.get<SessionModel[]>("/me/sessoes");
  return response.data;
}

export async function endSession(id: string): Promise<void> {
  await api.delete(`/me/sessoes/${id}`);
}
