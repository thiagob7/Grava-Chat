import { describe, expect, it } from "vitest";

import { cantoMaisProximo, encaixarNoCanto, posicaoDoCanto } from "./cantos";

const area = { largura: 1000, altura: 800, margem: 8 };
const card = { largura: 320, altura: 180 };
const em = (x: number, y: number) => ({ x, y, ...card });

describe("cantoMaisProximo", () => {
  it("largado em cima e à esquerda, vai pro canto superior esquerdo", () => {
    expect(cantoMaisProximo(em(20, 20), area)).toBe("superior-esquerdo");
  });

  it("largado em cima e à direita, vai pro canto superior direito", () => {
    expect(cantoMaisProximo(em(650, 20), area)).toBe("superior-direito");
  });

  it("largado embaixo e à esquerda, vai pro canto inferior esquerdo", () => {
    expect(cantoMaisProximo(em(20, 700), area)).toBe("inferior-esquerdo");
  });

  it("largado embaixo e à direita, vai pro canto inferior direito", () => {
    expect(cantoMaisProximo(em(650, 700), area)).toBe("inferior-direito");
  });

  it("decide pelo centro do card, não pelo canto de origem", () => {
    expect(cantoMaisProximo(em(400, 20), area)).toBe("superior-direito");
    expect(cantoMaisProximo(em(330, 20), area)).toBe("superior-esquerdo");
  });
});

describe("posicaoDoCanto", () => {
  it("respeita a margem nos quatro cantos", () => {
    expect(posicaoDoCanto("superior-esquerdo", card, area)).toEqual({ x: 8, y: 8 });
    expect(posicaoDoCanto("superior-direito", card, area)).toEqual({ x: 672, y: 8 });
    expect(posicaoDoCanto("inferior-esquerdo", card, area)).toEqual({ x: 8, y: 612 });
    expect(posicaoDoCanto("inferior-direito", card, area)).toEqual({ x: 672, y: 612 });
  });

  it("janela menor que o card não empurra ele pra fora da tela", () => {
    const apertada = { largura: 200, altura: 120, margem: 8 };

    expect(posicaoDoCanto("inferior-direito", card, apertada)).toEqual({ x: 8, y: 8 });
  });
});

describe("encaixarNoCanto", () => {
  it("solta no meio-baixo-direita e pousa no canto inferior direito", () => {
    expect(encaixarNoCanto(em(600, 500), area)).toEqual({ x: 672, y: 612 });
  });

  it("encaixar de novo no mesmo lugar não move nada", () => {
    const pousado = encaixarNoCanto(em(600, 500), area);

    expect(encaixarNoCanto({ ...pousado, ...card }, area)).toEqual(pousado);
  });
});
