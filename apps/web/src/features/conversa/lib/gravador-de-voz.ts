export const VOICE_RATE = 24_000;

export const LIMIT_MS = 120_000;

export const BARRAS = 40;

const PREFERRED = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

export function formatRecording(supports: (kind: string) => boolean): string | null {
  return PREFERRED.find(supports) ?? null;
}

export const formatExtension = (mime: string) =>
  mime.startsWith("audio/ogg") ? "ogg" : mime.startsWith("audio/mp4") ? "m4a" : "webm";

export function fitWaves(peaks: number[], barras = BARRAS): number[] {
  if (!peaks.length) return new Array(barras).fill(0);
  if (peaks.length <= barras) {
    return Array.from({ length: barras }, (_, i) => peaks[Math.floor((i * peaks.length) / barras)] ?? 0);
  }

  const byBar = peaks.length / barras;

  return Array.from({ length: barras }, (_, i) => {
    const piece = peaks.slice(Math.floor(i * byBar), Math.max(Math.floor((i + 1) * byBar), Math.floor(i * byBar) + 1));
    return piece.reduce((larger, v) => Math.max(larger, v), 0);
  });
}

export function writeWaves(peaks: number[]): string {
  return peaks
    .map((v) => Math.round(Math.min(Math.max(v, 0), 1) * 35).toString(36))
    .join("");
}

export function readWaves(text: string | null | undefined): number[] {
  if (!text) return [];

  return [...text].map((c) => {
    const n = parseInt(c, 36);
    return Number.isNaN(n) ? 0 : n / 35;
  });
}

export function durationWriting(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));

  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export const bytesEstimated = (ms: number) => Math.round((VOICE_RATE / 8) * (ms / 1000));
