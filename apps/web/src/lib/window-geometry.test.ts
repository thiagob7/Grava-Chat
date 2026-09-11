import { describe, expect, it } from "vitest";

import { fitOnScreen, defaultGeometry, MIN_SIZE } from "~/lib/window-geometry";

const SCREEN = { width: 1280, height: 800 };

describe("floating window geometry", () => {
  it("leaves alone what already fits", () => {
    const wanted = { x: 100, y: 60, width: 800, height: 500 };

    expect(fitOnScreen(wanted, SCREEN)).toEqual(wanted);
  });

  it("pulls back what fell off the right and the bottom", () => {
    const outside = fitOnScreen({ x: 5000, y: 5000, width: 800, height: 500 }, SCREEN);

    expect(outside.x).toBe(1280 - 800 - 8);
    expect(outside.y).toBe(800 - 500 - 8);
  });

  it("pulls back what fell off the left and the top", () => {
    const outside = fitOnScreen({ x: -900, y: -900, width: 800, height: 500 }, SCREEN);

    expect(outside.x).toBe(8);
    expect(outside.y).toBe(8);
  });

  it("never shrinks below a usable size", () => {
    const small = fitOnScreen({ x: 20, y: 20, width: 10, height: 10 }, SCREEN);

    expect(small.width).toBe(MIN_SIZE.width);
    expect(small.height).toBe(MIN_SIZE.height);
  });

  it("never grows past the screen", () => {
    const giant = fitOnScreen({ x: 0, y: 0, width: 9000, height: 9000 }, SCREEN);

    expect(giant.width).toBe(1280 - 16);
    expect(giant.height).toBe(800 - 16);
  });

  it("still fits when the screen is smaller than the minimum", () => {
    const pressed = fitOnScreen(
      { x: 0, y: 0, width: 400, height: 200 },
      { width: 320, height: 240 },
    );

    expect(pressed.x).toBe(8);
    expect(pressed.y).toBe(8);
    expect(pressed.width).toBe(320 - 16);
    expect(pressed.height).toBe(240 - 16);
  });

  it("the default is born centred and inside the screen", () => {
    const fallback = defaultGeometry(SCREEN);

    expect(fallback).toEqual(fitOnScreen(fallback, SCREEN));
    expect(fallback.x).toBe(Math.round((1280 - fallback.width) / 2));
    expect(fallback.y).toBe(Math.round((800 - fallback.height) / 2));
  });
});
