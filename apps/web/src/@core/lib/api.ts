import axios from "axios";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ""}/api`,
  withCredentials: true,
  timeout: 30_000,
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

/// Para quem descobre a sessão morta fora do caminho HTTP — o socket, por
/// exemplo, que é recusado no aperto de mão e não passa pelo interceptador.
export const avisarSessaoPerdida = () => onSessionLost?.();

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing: Promise<{ accessToken: string; user: unknown }> | null = null;

export function refreshSession<U>(): Promise<{ accessToken: string; user: U }> {
  refreshing ??= api
    /*
      Prazo curto, porque isto roda na ABERTURA e em quatro tentativas: com os
      30s do cliente, um servidor pendurado segurava o app por mais de dois
      minutos antes de qualquer tela aparecer. Trocar uma cópia de sessão é uma
      chamada pequena — oito segundos é muito mais do que ela precisa.
    */
    .post<{ accessToken: string; user: unknown }>("/auth/refresh", undefined, {
      timeout: 8_000,
    })
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
        if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
          onSessionLost?.();
        }
      }
    }

    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown, fallback = "Algo deu errado"): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
