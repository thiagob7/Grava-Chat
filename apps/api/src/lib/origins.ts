import { env, isDev } from "~/env.js";

const configuradas = env.WEB_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

/**
 * Quem pode falar com a API.
 *
 * Em desenvolvimento aceita também os domínios de túnel (ngrok), senão testar
 * com os amigos exigiria reeditar o .env e reiniciar a cada vez que o ngrok
 * sorteia uma URL nova. Em produção vale só o que está no WEB_ORIGIN.
 */
const TUNEIS_DEV = [/\.ngrok-free\.(dev|app)$/, /\.ngrok\.io$/, /\.trycloudflare\.com$/, /\.loca\.lt$/];

export function originPermitida(origin: string | undefined): boolean {
  // requisições sem Origin (curl, app nativo, same-origin) passam
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

/** Assinatura que o @fastify/cors e o Socket.IO esperam. */
export function corsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, permitido: boolean) => void,
): void {
  callback(null, originPermitida(origin));
}
