import { describe, expect, it } from "vitest";

import { contrast, readable, luminance, forRgb } from "./contraste";

const BACKGROUND = "#18181b";

describe("piso de contraste", () => {
  it("mede o extremo conhecido: preto contra branco é 21:1", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("preto tem luminância 0 e branco tem 1", () => {
    expect(luminance("#000000")).toBe(0);
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("aceita hex de 3 dígitos", () => {
    expect(luminance("#fff")).toBeCloseTo(luminance("#ffffff"), 5);
  });

  it("não mexe na cor que já dá pra ler", () => {
    expect(readable("#22d3ee", BACKGROUND)).toBe("#22d3ee");
  });

  it("clareia o roxo escuro até passar dos 3:1", () => {
    const adjusted = readable("#2a0a4a", BACKGROUND);

    expect(adjusted).not.toBe("#2a0a4a");
    expect(contrast(adjusted, BACKGROUND)).toBeGreaterThanOrEqual(3);
  });

  it("mantém a cor que a pessoa quis: um roxo escuro vira roxo claro, não cinza", () => {
    const [r, g, b] = forRgb(readable("#2a0a4a", BACKGROUND));

    expect(b).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(g);
  });

  it("escurece quando o fundo é claro, em vez de clarear", () => {
    const adjusted = readable("#fffacd", "#ffffff");

    expect(contrast(adjusted, "#ffffff")).toBeGreaterThanOrEqual(3);
    expect(luminance(adjusted)).toBeLessThan(luminance("#fffacd"));
  });

  it("devolve o que veio quando não é hex — a cor pode ser um token do tema", () => {
    expect(readable("var(--color-brand)", BACKGROUND)).toBe("var(--color-brand)");
  });

  it("garante o piso para toda cor do espectro contra o fundo do app", () => {
    for (let h = 0; h < 360; h += 15) {
      const color = hueColor(h, 0.18);

      expect(contrast(readable(color, BACKGROUND), BACKGROUND)).toBeGreaterThanOrEqual(3);
    }
  });
});

function hueColor(h: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * 1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const tracks: [number, number, number][] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const rgb = tracks[Math.floor(h / 60) % 6] ?? tracks[0]!;

  return `#${rgb.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("")}`;
}
