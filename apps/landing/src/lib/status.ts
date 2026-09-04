
const API = "https://gravaechat-api.duckdns.org/api";

export const PECAS = ["api", "banco", "cache", "sfu"] as const;
export type Peca = (typeof PECAS)[number];

export const NOMES: Record<Peca, string> = {
  api: "API",
  banco: "Banco de dados",
  cache: "Cache",
  sfu: "Servidor de voz",
};

export interface Medida {
  peca: Peca;
  estado: "up" | "down";
  ms: number;
}

export interface DiaDaJanela {
  dia: string;
  uptime: number | null;
}

export interface Status {
  pecas: readonly Peca[];
  agora: Medida[];
  janela: Record<Peca, DiaDaJanela[]>;
  dias: number;
  em: string;
}

export async function buscarStatus(): Promise<Status | null> {
  const resposta = await fetch(`${API}/publico/status`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!resposta.ok) return null;

  return (await resposta.json()) as Status;
}
