import { describe, expect, it } from "vitest";

import { encaixarNaTela, geometriaPadrao, MINIMO } from "~/lib/geometria-de-janela";

const TELA = { largura: 1280, altura: 800 };

describe("geometria de uma janela flutuante", () => {
  it("deixa em paz o que já cabe", () => {
    const pedida = { x: 100, y: 60, largura: 800, altura: 500 };

    expect(encaixarNaTela(pedida, TELA)).toEqual(pedida);
  });

  /// Janela que some fora da tela não tem como voltar: não há barra para pegar.
  it("puxa de volta o que saiu pela direita e por baixo", () => {
    const fora = encaixarNaTela({ x: 5000, y: 5000, largura: 800, altura: 500 }, TELA);

    expect(fora.x).toBe(1280 - 800 - 8);
    expect(fora.y).toBe(800 - 500 - 8);
  });

  it("puxa de volta o que saiu pela esquerda e por cima", () => {
    const fora = encaixarNaTela({ x: -900, y: -900, largura: 800, altura: 500 }, TELA);

    expect(fora.x).toBe(8);
    expect(fora.y).toBe(8);
  });

  it("não deixa encolher abaixo do que dá para usar", () => {
    const mirim = encaixarNaTela({ x: 20, y: 20, largura: 10, altura: 10 }, TELA);

    expect(mirim.largura).toBe(MINIMO.largura);
    expect(mirim.altura).toBe(MINIMO.altura);
  });

  it("não deixa passar do tamanho da tela", () => {
    const gigante = encaixarNaTela({ x: 0, y: 0, largura: 9000, altura: 9000 }, TELA);

    expect(gigante.largura).toBe(1280 - 16);
    expect(gigante.altura).toBe(800 - 16);
  });

  /*
    Numa tela menor que o mínimo, a tela ganha: janela que passa da borda some
    metade, e a metade que some costuma ser a dos botões.
  */
  it("cabe na tela mesmo quando a tela é menor que o mínimo", () => {
    const apertada = encaixarNaTela(
      { x: 0, y: 0, largura: 400, altura: 200 },
      { largura: 320, altura: 240 },
    );

    expect(apertada.x).toBe(8);
    expect(apertada.y).toBe(8);
    expect(apertada.largura).toBe(320 - 16);
    expect(apertada.altura).toBe(240 - 16);
  });

  it("o padrão nasce centralizado e dentro da tela", () => {
    const padrao = geometriaPadrao(TELA);

    expect(padrao).toEqual(encaixarNaTela(padrao, TELA));
    expect(padrao.x).toBe(Math.round((1280 - padrao.largura) / 2));
    expect(padrao.y).toBe(Math.round((800 - padrao.altura) / 2));
  });
});
