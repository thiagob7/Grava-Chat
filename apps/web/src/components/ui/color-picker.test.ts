import { describe, expect, it } from "vitest";

import { colorAtPosition, formatColor, parseColor, colorPosition } from "./color-picker";

describe("ler e escrever cor", () => {
  it("lê os dois formatos em que os tokens do tema estão escritos", () => {
    expect(parseColor("#1a181e")).toMatchObject({ a: 1 });
    expect(parseColor("rgb(201 197 211 / 0.15)")).toMatchObject({ a: 0.15 });
  });

  it("devolve nulo no que não é cor, em vez de estourar", () => {
    expect(parseColor("color-mix(in oklab, red, blue)")).toBeNull();
    expect(parseColor("")).toBeNull();
    expect(parseColor("var(--color-brand)")).toBeNull();
  });

  it("mantém a cor na ida e na volta", () => {
    for (const original of ["#1a181e", "#2a2730", "#5865f2", "#ffffff", "#000000"]) {
      expect(formatColor(parseColor(original)!)).toBe(original);
    }
  });

  it("mantém a opacidade na ida e na volta", () => {
    expect(formatColor(parseColor("rgb(201 197 211 / 0.15)")!)).toBe(
      "rgb(201 197 211 / 0.15)",
    );
  });

  it("escolhe o formato pela opacidade", () => {
    expect(formatColor({ h: 260, s: 11, l: 11, a: 1 })).toMatch(/^#[0-9a-f]{6}$/);
    expect(formatColor({ h: 260, s: 11, l: 11, a: 0.5 })).toMatch(/^rgb\(.+ \/ 0\.5\)$/);
  });

  it("não deixa NaN escapar no cinza", () => {
    expect(parseColor("#808080")!.h).toBe(0);
    expect(Number.isFinite(parseColor("#ffffff")!.h)).toBe(true);
  });

  it("a posição da bolinha é o inverso exato do arrasto", () => {
    for (const x of [0, 0.25, 0.5, 0.75, 1]) {
      for (const y of [0, 0.3, 0.6, 1]) {
        const volta = colorPosition(colorAtPosition(x, y));

        expect(volta.x).toBeCloseTo(x, 6);
        expect(volta.y).toBeCloseTo(y, 6);
      }
    }
  });

  it("acha a bolinha para as cores que os tokens realmente têm", () => {
    for (const token of ["#1a181e", "#2a2730", "#5865f2", "#ffffff", "#000000"]) {
      const { x, y } = colorPosition(parseColor(token)!);

      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1);
    }
  });
});
