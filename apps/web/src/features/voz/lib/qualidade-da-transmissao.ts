/*
  A qualidade da transmissão de tela, como quem transmite escolheu.

  Sem escolha, valia o padrão do LiveKit: pedir 1080p a 15 quadros e aceitar o
  que viesse, que numa janela solta sai com a altura dela (1006p, 1133p...).
  Agora a resolução é um TETO, nunca esticada acima do que a janela tem, e a
  taxa de bits acompanha o tamanho e o ritmo dos quadros.

  O valor vem do localStorage, então passa por aqui antes de virar mídia.
*/
export const SCREEN_RESOLUTIONS = ["480", "720", "1080", "1440", "original"] as const;
export const SCREEN_FRAME_RATES = [15, 30, 60] as const;

export type ScreenResolution = (typeof SCREEN_RESOLUTIONS)[number];
export type ScreenFrameRate = (typeof SCREEN_FRAME_RATES)[number];

export const DEFAULT_SCREEN_RESOLUTION: ScreenResolution = "720";
export const DEFAULT_SCREEN_FRAME_RATE: ScreenFrameRate = 30;

const HEIGHT: Record<ScreenResolution, number> = {
  "480": 480,
  "720": 720,
  "1080": 1080,
  "1440": 1440,
  original: 0,
};

const BITRATE_AT_30: Record<ScreenResolution, number> = {
  "480": 1_000_000,
  "720": 2_000_000,
  "1080": 4_000_000,
  "1440": 6_000_000,
  original: 7_000_000,
};

const PACE: Record<ScreenFrameRate, number> = { 15: 0.6, 30: 1, 60: 1.5 };

export function screenQuality(resolution: unknown, frameRate: unknown) {
  const size = SCREEN_RESOLUTIONS.includes(resolution as ScreenResolution)
    ? (resolution as ScreenResolution)
    : DEFAULT_SCREEN_RESOLUTION;
  const fps = SCREEN_FRAME_RATES.includes(frameRate as ScreenFrameRate)
    ? (frameRate as ScreenFrameRate)
    : DEFAULT_SCREEN_FRAME_RATE;

  const height = HEIGHT[size];
  const width = Math.round((height * 16) / 9);
  const frames = { ideal: fps, max: fps };

  return {
    resolution: size,
    frameRate: fps,
    capture: { width, height, frameRate: fps },
    constraints: (height
      ? { width: { max: width }, height: { max: height }, frameRate: frames }
      : { frameRate: frames }) as MediaTrackConstraints,
    encoding: { maxBitrate: Math.round(BITRATE_AT_30[size] * PACE[fps]), maxFramerate: fps },
    contentHint: (fps >= 60 ? "motion" : "detail") as "motion" | "detail",
  };
}
