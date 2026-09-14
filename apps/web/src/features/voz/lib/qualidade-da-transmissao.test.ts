import { describe, expect, it } from "vitest";

import {
  DEFAULT_SCREEN_FRAME_RATE,
  DEFAULT_SCREEN_RESOLUTION,
  isScreenFrameRateLocked,
  isScreenResolutionLocked,
  screenQuality,
} from "./qualidade-da-transmissao";

describe("qualidade da transmissão de tela", () => {
  it("a resolução escolhida vira teto, sem esticar a janela", () => {
    expect(screenQuality("720", 15).constraints).toEqual({
      width: { max: 1280 },
      height: { max: 720 },
      frameRate: { ideal: 15, max: 15 },
    });
  });

  it("opção bloqueada, mesmo guardada de antes, cai em 720p a 15 quadros", () => {
    const quality = screenQuality("1080", 60);

    expect(quality.resolution).toBe("720");
    expect(quality.frameRate).toBe(15);
  });

  it("acima de 720p e de 15 quadros fica bloqueado", () => {
    expect(isScreenResolutionLocked("720")).toBe(false);
    expect(isScreenResolutionLocked("1080")).toBe(true);
    expect(isScreenResolutionLocked("original")).toBe(true);
    expect(isScreenFrameRateLocked(15)).toBe(false);
    expect(isScreenFrameRateLocked(30)).toBe(true);
  });

  it("valor estragado no armazenamento cai no padrão em vez de quebrar a transmissão", () => {
    const quality = screenQuality("4k", 144);

    expect(quality.resolution).toBe(DEFAULT_SCREEN_RESOLUTION);
    expect(quality.frameRate).toBe(DEFAULT_SCREEN_FRAME_RATE);
  });
});
