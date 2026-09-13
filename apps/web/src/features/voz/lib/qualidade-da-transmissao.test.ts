import { describe, expect, it } from "vitest";

import { DEFAULT_SCREEN_FRAME_RATE, DEFAULT_SCREEN_RESOLUTION, screenQuality } from "./qualidade-da-transmissao";

describe("qualidade da transmissão de tela", () => {
  it("a resolução escolhida vira teto, sem esticar a janela", () => {
    expect(screenQuality("720", 30).constraints).toEqual({
      width: { max: 1280 },
      height: { max: 720 },
      frameRate: { ideal: 30, max: 30 },
    });
  });

  it("original não limita o tamanho, só o ritmo", () => {
    expect(screenQuality("original", 60).constraints).toEqual({ frameRate: { ideal: 60, max: 60 } });
  });

  it("mais quadros pedem mais banda", () => {
    const at15 = screenQuality("1080", 15).encoding.maxBitrate;
    const at30 = screenQuality("1080", 30).encoding.maxBitrate;
    const at60 = screenQuality("1080", 60).encoding.maxBitrate;

    expect(at15).toBeLessThan(at30);
    expect(at30).toBeLessThan(at60);
  });

  it("60 quadros segura o ritmo e cede nitidez; os outros seguram o texto nítido", () => {
    expect(screenQuality("720", 60).contentHint).toBe("motion");
    expect(screenQuality("720", 30).contentHint).toBe("detail");
  });

  it("valor estragado no armazenamento cai no padrão em vez de quebrar a transmissão", () => {
    const quality = screenQuality("4k", 144);

    expect(quality.resolution).toBe(DEFAULT_SCREEN_RESOLUTION);
    expect(quality.frameRate).toBe(DEFAULT_SCREEN_FRAME_RATE);
  });
});
