import { describe, expect, it } from "vitest";

import {
  apertarProporcao,
  PROPORCAO_MAIS_ESTREITA,
  PROPORCAO_PADRAO,
} from "~/hooks/use-proporcao-da-faixa";

describe("a proporção da faixa do servidor", () => {
  it("usa a proporção da imagem quando ela cabe no intervalo", () => {
    expect(apertarProporcao(1000, 400)).toBeCloseTo(2.5, 5);
  });

  /*
    O caso que estragava a barra: faixa muito mais larga que alta.

    Sem o teto, uma tira de 1000×80 (12,5:1) viraria 19 pixels de altura numa
    barra de 240 — o nome do servidor não caberia nela, e a imagem não seria
    reconhecível.
  */
  it("não deixa a faixa mais estreita que 32/9", () => {
    expect(apertarProporcao(1000, 80)).toBe(PROPORCAO_MAIS_ESTREITA);
  });

  /// E o oposto: imagem quadrada ocuparia a lista de canais inteira.
  it("não deixa a faixa mais alta que 16/9", () => {
    expect(apertarProporcao(500, 500)).toBe(PROPORCAO_PADRAO);
  });

  it("cai no padrão quando a medida não faz sentido", () => {
    expect(apertarProporcao(0, 100)).toBe(PROPORCAO_PADRAO);
    expect(apertarProporcao(100, 0)).toBe(PROPORCAO_PADRAO);
    expect(apertarProporcao(Number.NaN, 100)).toBe(PROPORCAO_PADRAO);
    expect(apertarProporcao(-10, 100)).toBe(PROPORCAO_PADRAO);
  });

  /*
    A conta que a barra faz, conferida nas duas pontas: 240 de largura é o
    padrão, e 420 é o máximo que a alça permite. Em nenhuma delas a faixa
    passa dos 30% de uma janela comum — o outro teto vive no CSS.
  */
  it("dá alturas plausíveis nas larguras que a barra assume", () => {
    expect(Math.round(240 / apertarProporcao(1600, 900))).toBe(135);
    expect(Math.round(420 / apertarProporcao(1600, 900))).toBe(236);
    expect(Math.round(240 / apertarProporcao(2400, 600))).toBe(68);
  });
});
