import { env, isDev } from "~/env.js";

const configuradas = env.WEB_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

const TUNEIS_DEV = [/\.ngrok-free\.(dev|app)$/, /\.ngrok\.io$/, /\.trycloudflare\.com$/, /\.loca\.lt$/];

export function originPermitida(origin: string | undefined): boolean {
  if (!origin) return true;
  if (configuradas.includes(origin)) return true;

  if (!isDev) return false;

  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    return TUNEIS_DEV.some((padrao) => padrao.test(hostname));
  } catch {
    return false;
  }
}

export function corsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, permitido: boolean) => void,
): void {
  callback(null, originPermitida(origin));
}
