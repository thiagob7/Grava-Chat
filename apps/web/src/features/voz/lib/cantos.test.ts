import { describe, expect, it } from "vitest";

import { nextCornerMore, fitCorner, cornerPosition } from "./cantos";

const area = { width: 1000, height: 800, margin: 8 };
const card = { width: 320, height: 180 };
const em = (x: number, y: number) => ({ x, y, ...card });

describe("cantoMaisProximo", () => {
  it("largado em cima e à esquerda, vai pro canto superior esquerdo", () => {
    expect(nextCornerMore(em(20, 20), area)).toBe("superior-esquerdo");
  });

  it("largado em cima e à direita, vai pro canto superior direito", () => {
    expect(nextCornerMore(em(650, 20), area)).toBe("superior-direito");
  });

  it("largado embaixo e à esquerda, vai pro canto inferior esquerdo", () => {
    expect(nextCornerMore(em(20, 700), area)).toBe("inferior-esquerdo");
  });

  it("largado embaixo e à direita, vai pro canto inferior direito", () => {
    expect(nextCornerMore(em(650, 700), area)).toBe("inferior-direito");
  });

  it("decide pelo centro do card, não pelo canto de origem", () => {
    expect(nextCornerMore(em(400, 20), area)).toBe("superior-direito");
    expect(nextCornerMore(em(330, 20), area)).toBe("superior-esquerdo");
  });
});

describe("posicaoDoCanto", () => {
  it("respeita a margem nos quatro cantos", () => {
    expect(cornerPosition("superior-esquerdo", card, area)).toEqual({ x: 8, y: 8 });
    expect(cornerPosition("superior-direito", card, area)).toEqual({ x: 672, y: 8 });
    expect(cornerPosition("inferior-esquerdo", card, area)).toEqual({ x: 8, y: 612 });
    expect(cornerPosition("inferior-direito", card, area)).toEqual({ x: 672, y: 612 });
  });

  it("janela menor que o card não empurra ele pra fora da tela", () => {
    const pressed = { width: 200, height: 120, margin: 8 };

    expect(cornerPosition("inferior-direito", card, pressed)).toEqual({ x: 8, y: 8 });
  });
});

describe("encaixarNoCanto", () => {
  it("solta no meio-baixo-direita e pousa no canto inferior direito", () => {
    expect(fitCorner(em(600, 500), area)).toEqual({ x: 672, y: 612 });
  });

  it("encaixar de novo no mesmo lugar não move nada", () => {
    const landed = fitCorner(em(600, 500), area);

    expect(fitCorner({ ...landed, ...card }, area)).toEqual(landed);
  });
});
