import { api, setAccessToken } from "~/@core/lib/api";

export async function logout(): Promise<void> {
  await api.post("/auth/logout").catch(() => undefined);
  setAccessToken(null);
}

export async function logoutAll(): Promise<void> {
  await api.post("/auth/logout-all").catch(() => undefined);
  setAccessToken(null);
}
