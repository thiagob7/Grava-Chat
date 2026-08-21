import axios from "axios";

/**
 * Cliente HTTP único. Mesma forma do `@core/lib/api.ts` do backoffice (instância
 * axios + interceptor de refresh com fila), com UMA diferença deliberada:
 *
 * o access token vive só em memória e o refresh vive num cookie httpOnly, em vez
 * de os dois no localStorage. Um XSS lê localStorage; não lê cookie httpOnly.
 * Por isso não há `Authorization` persistido nem leitura de storage aqui.
 */
/**
 * Sem VITE_API_URL, usa caminho relativo (`/api`) — o Vite faz proxy em
 * desenvolvimento e, atrás do ngrok ou do Caddy, front e API compartilham a
 * origem. Só defina VITE_API_URL se a API estiver mesmo em outro domínio.
 */
export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ""}/api`,
  // manda o cookie httpOnly do refresh nas chamadas cross-origin
  withCredentials: true,
});

let accessToken: string | null = null;
let onSessionLost: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;
export const setSessionLostHandler = (fn: () => void) => {
  onSessionLost = fn;
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

/**
 * Uma única tentativa de refresh por vez, compartilhada por todos os chamadores
 * — inclusive o bootstrap da aplicação. Sem isso: o StrictMode do React executa
 * o efeito duas vezes em desenvolvimento, as duas chamadas saem juntas, e como
 * o refresh token rotaciona a segunda chega com um token já rotacionado e
 * derruba a sessão. O mesmo acontece com duas abas abrindo ao mesmo tempo.
 */
let refreshing: Promise<{ accessToken: string; user: unknown }> | null = null;

export function refreshSession<U>(): Promise<{ accessToken: string; user: U }> {
  refreshing ??= api
    .post<{ accessToken: string; user: unknown }>("/auth/refresh")
    .then((res) => {
      accessToken = res.data.accessToken;
      return res.data;
    })
    .catch((err) => {
      accessToken = null;
      throw err;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing as Promise<{ accessToken: string; user: U }>;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthCall = original?.url?.startsWith("/auth/");

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;

      try {
        await refreshSession();
        return api(original);
      } catch (refreshError) {
        /**
         * Só perde a sessão se o servidor DISSER que ela acabou. API reiniciando,
         * wifi caindo ou 502 do proxy não são motivo pra jogar a pessoa na tela
         * de login — ela volta sozinha quando a rede volta.
         */
        if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
          onSessionLost?.();
        }
      }
    }

    return Promise.reject(error);
  },
);

/** Mensagem legível vinda da API, com fallback. */
export function apiErrorMessage(error: unknown, fallback = "Algo deu errado"): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
