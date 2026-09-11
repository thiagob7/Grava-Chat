
const API = "https://gravaechat-api.duckdns.org/api";

export const PIECES = ["api", "banco", "cache", "sfu"] as const;
export type Piece = (typeof PIECES)[number];

export const NAMES: Record<Piece, string> = {
  api: "API",
  banco: "Banco de dados",
  cache: "Cache",
  sfu: "Servidor de voz",
};

export interface Measure {
  piece: Piece;
  state: "up" | "down";
  ms: number;
}

export interface WindowDay {
  day: string;
  uptime: number | null;
}

export interface Status {
  pieces: readonly Piece[];
  now: Measure[];
  appWindow: Record<Piece, WindowDay[]>;
  days: number;
  em: string;
}

export async function searchStatus(): Promise<Status | null> {
  const reply = await fetch(`${API}/publico/status`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!reply.ok) return null;

  return (await reply.json()) as Status;
}
