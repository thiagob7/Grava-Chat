import { describe, expect, it } from "vitest";
import { PLAN_LIMITS } from "@gravae/shared";

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

  it("no grátis, acima de 720p e de 30 quadros fica bloqueado", () => {
    expect(isScreenResolutionLocked("720")).toBe(false);
    expect(isScreenResolutionLocked("1080")).toBe(true);
    expect(isScreenResolutionLocked("original")).toBe(true);
    expect(isScreenFrameRateLocked(30)).toBe(false);
    expect(isScreenFrameRateLocked(60)).toBe(true);
  });

  it("valor estragado no armazenamento cai no padrão em vez de quebrar a transmissão", () => {
    const quality = screenQuality("4k", 144);

    expect(quality.resolution).toBe(DEFAULT_SCREEN_RESOLUTION);
    expect(quality.frameRate).toBe(DEFAULT_SCREEN_FRAME_RATE);
  });

  it("no premium, 1080p a 60 quadros deixa de ser bloqueado e é respeitado", () => {
    const quality = screenQuality("1080", 60, PLAN_LIMITS.premium);

    expect(isScreenResolutionLocked("1080", PLAN_LIMITS.premium)).toBe(false);
    expect(isScreenResolutionLocked("1440", PLAN_LIMITS.premium)).toBe(true);
    expect(isScreenFrameRateLocked(60, PLAN_LIMITS.premium)).toBe(false);
    expect(quality.resolution).toBe("1080");
    expect(quality.frameRate).toBe(60);
  });
});
