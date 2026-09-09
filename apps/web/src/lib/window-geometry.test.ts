import { describe, expect, it } from "vitest";

import { fitOnScreen, defaultGeometry, MIN_SIZE } from "~/lib/window-geometry";

const SCREEN = { width: 1280, height: 800 };

describe("floating window geometry", () => {
  it("leaves alone what already fits", () => {
    const wanted = { x: 100, y: 60, width: 800, height: 500 };

    expect(fitOnScreen(wanted, SCREEN)).toEqual(wanted);
  });

  it("pulls back what fell off the right and the bottom", () => {
    const fora = fitOnScreen({ x: 5000, y: 5000, width: 800, height: 500 }, SCREEN);

    expect(fora.x).toBe(1280 - 800 - 8);
    expect(fora.y).toBe(800 - 500 - 8);
  });

  it("pulls back what fell off the left and the top", () => {
    const fora = fitOnScreen({ x: -900, y: -900, width: 800, height: 500 }, SCREEN);

    expect(fora.x).toBe(8);
    expect(fora.y).toBe(8);
  });

  it("never shrinks below a usable size", () => {
    const mirim = fitOnScreen({ x: 20, y: 20, width: 10, height: 10 }, SCREEN);

    expect(mirim.width).toBe(MIN_SIZE.width);
    expect(mirim.height).toBe(MIN_SIZE.height);
  });

  it("never grows past the screen", () => {
    const gigante = fitOnScreen({ x: 0, y: 0, width: 9000, height: 9000 }, SCREEN);

    expect(gigante.width).toBe(1280 - 16);
    expect(gigante.height).toBe(800 - 16);
  });

  it("still fits when the screen is smaller than the minimum", () => {
    const apertada = fitOnScreen(
      { x: 0, y: 0, width: 400, height: 200 },
      { width: 320, height: 240 },
    );

    expect(apertada.x).toBe(8);
    expect(apertada.y).toBe(8);
    expect(apertada.width).toBe(320 - 16);
    expect(apertada.height).toBe(240 - 16);
  });

  it("the default is born centred and inside the screen", () => {
    const padrao = defaultGeometry(SCREEN);

    expect(padrao).toEqual(fitOnScreen(padrao, SCREEN));
    expect(padrao.x).toBe(Math.round((1280 - padrao.width) / 2));
    expect(padrao.y).toBe(Math.round((800 - padrao.height) / 2));
  });
});
