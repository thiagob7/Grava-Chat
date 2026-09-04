import { describe, expect, it } from "vitest";

import { contraste, legivel, luminancia, paraRgb } from "./contraste";

const FUNDO = "#18181b";

describe("piso de contraste", () => {
  it("mede o extremo conhecido: preto contra branco é 21:1", () => {
    expect(contraste("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("preto tem luminância 0 e branco tem 1", () => {
    expect(luminancia("#000000")).toBe(0);
    expect(luminancia("#ffffff")).toBeCloseTo(1, 5);
  });

  it("aceita hex de 3 dígitos", () => {
    expect(luminancia("#fff")).toBeCloseTo(luminancia("#ffffff"), 5);
  });

  it("não mexe na cor que já dá pra ler", () => {
    expect(legivel("#22d3ee", FUNDO)).toBe("#22d3ee");
  });

  it("clareia o roxo escuro até passar dos 3:1", () => {
    const ajustada = legivel("#2a0a4a", FUNDO);

    expect(ajustada).not.toBe("#2a0a4a");
    expect(contraste(ajustada, FUNDO)).toBeGreaterThanOrEqual(3);
  });

  it("mantém a cor que a pessoa quis: um roxo escuro vira roxo claro, não cinza", () => {
    const [r, g, b] = paraRgb(legivel("#2a0a4a", FUNDO));

    expect(b).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(g);
  });

  it("escurece quando o fundo é claro, em vez de clarear", () => {
    const ajustada = legivel("#fffacd", "#ffffff");

    expect(contraste(ajustada, "#ffffff")).toBeGreaterThanOrEqual(3);
    expect(luminancia(ajustada)).toBeLessThan(luminancia("#fffacd"));
  });

  it("devolve o que veio quando não é hex — a cor pode ser um token do tema", () => {
    expect(legivel("var(--color-brand)", FUNDO)).toBe("var(--color-brand)");
  });

  it("garante o piso para toda cor do espectro contra o fundo do app", () => {
    for (let h = 0; h < 360; h += 15) {
      const cor = corDoMatiz(h, 0.18);

      expect(contraste(legivel(cor, FUNDO), FUNDO)).toBeGreaterThanOrEqual(3);
    }
  });
});

function corDoMatiz(h: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * 1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const faixas: [number, number, number][] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const rgb = faixas[Math.floor(h / 60) % 6] ?? faixas[0]!;

  return `#${rgb.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("")}`;
}
