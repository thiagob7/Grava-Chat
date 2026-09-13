import { describe, expect, it } from "vitest";

import { audioBitrate, BITRATE_CEILING, BITRATE_FALLBACK, BITRATE_FLOOR } from "./taxa-de-bits";

describe("taxa de bits do microfone", () => {
  it("o que o canal pediu passa como está", () => {
    expect(audioBitrate(48_000)).toBe(48_000);
  });

  it("canal antigo sem taxa cai no padrão", () => {
    expect(audioBitrate(undefined)).toBe(BITRATE_FALLBACK);
  });

  it("número que não é número cai no padrão em vez de quebrar a chamada", () => {
    expect(audioBitrate(Number.NaN)).toBe(BITRATE_FALLBACK);
    expect(audioBitrate(Number.POSITIVE_INFINITY)).toBe(BITRATE_FALLBACK);
  });

  it("abaixo do piso sobe até o piso: fala tem que continuar inteligível", () => {
    expect(audioBitrate(0)).toBe(BITRATE_FLOOR);
    expect(audioBitrate(-5_000)).toBe(BITRATE_FLOOR);
  });

  it("acima do teto desce até o teto", () => {
    expect(audioBitrate(510_000)).toBe(BITRATE_CEILING);
  });

  it("quebrado vira inteiro, porque o encoder não aceita fração", () => {
    expect(audioBitrate(32_000.7)).toBe(32_001);
  });
});
