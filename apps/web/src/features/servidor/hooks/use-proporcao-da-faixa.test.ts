import { describe, expect, it } from "vitest";

import {
  pressRatio,
  RATIO_MORE_NARROW,
  DEFAULT_RATIO,
} from "~/features/servidor/hooks/use-proporcao-da-faixa";

describe("a proporção da faixa do servidor", () => {
  it("usa a proporção da imagem quando ela cabe no intervalo", () => {
    expect(pressRatio(1000, 400)).toBeCloseTo(2.5, 5);
  });

  it("não deixa a faixa mais estreita que 32/9", () => {
    expect(pressRatio(1000, 80)).toBe(RATIO_MORE_NARROW);
  });

  it("não deixa a faixa mais alta que 16/9", () => {
    expect(pressRatio(500, 500)).toBe(DEFAULT_RATIO);
  });

  it("cai no padrão quando a medida não faz sentido", () => {
    expect(pressRatio(0, 100)).toBe(DEFAULT_RATIO);
    expect(pressRatio(100, 0)).toBe(DEFAULT_RATIO);
    expect(pressRatio(Number.NaN, 100)).toBe(DEFAULT_RATIO);
    expect(pressRatio(-10, 100)).toBe(DEFAULT_RATIO);
  });

  it("dá alturas plausíveis nas larguras que a barra assume", () => {
    expect(Math.round(240 / pressRatio(1600, 900))).toBe(135);
    expect(Math.round(420 / pressRatio(1600, 900))).toBe(236);
    expect(Math.round(240 / pressRatio(2400, 600))).toBe(68);
  });
});
