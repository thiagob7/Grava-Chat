import { env, isDev } from "~/env.js";

const configured = env.WEB_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

const TUNNELS_DEV = [/\.ngrok-free\.(dev|app)$/, /\.ngrok\.io$/, /\.trycloudflare\.com$/, /\.loca\.lt$/];

export function originAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  if (configured.includes(origin)) return true;

  if (env.ACCEPT_PREVIEWS_VERCEL && isVercelPreview(origin)) return true;

  if (!isDev) return false;

  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    return TUNNELS_DEV.some((fallback) => fallback.test(hostname));
  } catch {
    return false;
  }
}

function isVercelPreview(origin: string): boolean {
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === "https:" && /\.vercel\.app$/.test(hostname);
  } catch {
    return false;
  }
}

export function corsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allowed: boolean) => void,
): void {
  callback(null, originAllowed(origin));
}
