import { api, setAccessToken } from "~/@core/lib/api";

export async function logout(): Promise<void> {
  await api.post("/auth/logout").catch(() => undefined);
  setAccessToken(null);
}

/**
 * Encerra TODAS as sessões da conta, inclusive esta. Existe para o caso de ter
 * ficado logado num computador que não é seu — é o único jeito de tirar de lá.
 */
export async function logoutAll(): Promise<void> {
  await api.post("/auth/logout-all").catch(() => undefined);
  setAccessToken(null);
}
