export const TAXA_DE_VOZ = 24_000;

export const LIMITE_MS = 120_000;

export const BARRAS = 40;

const PREFERIDOS = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

export function formatoDeGravacao(suporta: (tipo: string) => boolean): string | null {
  return PREFERIDOS.find(suporta) ?? null;
}

export const extensaoDoFormato = (mime: string) =>
  mime.startsWith("audio/ogg") ? "ogg" : mime.startsWith("audio/mp4") ? "m4a" : "webm";

export function encaixarOndas(picos: number[], barras = BARRAS): number[] {
  if (!picos.length) return new Array(barras).fill(0);
  if (picos.length <= barras) {
    return Array.from({ length: barras }, (_, i) => picos[Math.floor((i * picos.length) / barras)] ?? 0);
  }

  const porBarra = picos.length / barras;

  return Array.from({ length: barras }, (_, i) => {
    const pedaco = picos.slice(Math.floor(i * porBarra), Math.max(Math.floor((i + 1) * porBarra), Math.floor(i * porBarra) + 1));
    return pedaco.reduce((maior, v) => Math.max(maior, v), 0);
  });
}

export function escreverOndas(picos: number[]): string {
  return picos
    .map((v) => Math.round(Math.min(Math.max(v, 0), 1) * 35).toString(36))
    .join("");
}

export function lerOndas(texto: string | null | undefined): number[] {
  if (!texto) return [];

  return [...texto].map((c) => {
    const n = parseInt(c, 36);
    return Number.isNaN(n) ? 0 : n / 35;
  });
}

export function duracaoEscrita(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));

  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export const bytesEstimados = (ms: number) => Math.round((TAXA_DE_VOZ / 8) * (ms / 1000));
