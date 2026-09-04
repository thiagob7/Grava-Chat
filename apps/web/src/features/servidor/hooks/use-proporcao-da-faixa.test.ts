import { describe, expect, it } from "vitest";

import {
  apertarProporcao,
  PROPORCAO_MAIS_ESTREITA,
  PROPORCAO_PADRAO,
} from "~/features/servidor/hooks/use-proporcao-da-faixa";

describe("a proporção da faixa do servidor", () => {
  it("usa a proporção da imagem quando ela cabe no intervalo", () => {
    expect(apertarProporcao(1000, 400)).toBeCloseTo(2.5, 5);
  });

  it("não deixa a faixa mais estreita que 32/9", () => {
    expect(apertarProporcao(1000, 80)).toBe(PROPORCAO_MAIS_ESTREITA);
  });

  it("não deixa a faixa mais alta que 16/9", () => {
    expect(apertarProporcao(500, 500)).toBe(PROPORCAO_PADRAO);
  });

  it("cai no padrão quando a medida não faz sentido", () => {
    expect(apertarProporcao(0, 100)).toBe(PROPORCAO_PADRAO);
    expect(apertarProporcao(100, 0)).toBe(PROPORCAO_PADRAO);
    expect(apertarProporcao(Number.NaN, 100)).toBe(PROPORCAO_PADRAO);
    expect(apertarProporcao(-10, 100)).toBe(PROPORCAO_PADRAO);
  });

  it("dá alturas plausíveis nas larguras que a barra assume", () => {
    expect(Math.round(240 / apertarProporcao(1600, 900))).toBe(135);
    expect(Math.round(420 / apertarProporcao(1600, 900))).toBe(236);
    expect(Math.round(240 / apertarProporcao(2400, 600))).toBe(68);
  });
});
