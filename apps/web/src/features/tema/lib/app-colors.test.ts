import { describe, expect, it } from "vitest";

import { appColorsCss, colorAt, gradientOf, TINTED_TOKENS } from "./app-colors";

const base = { "--color-surface-0": "#1a181e", "--color-surface-1": "#1e1d23" } as const;

describe("cores do app", () => {
  it("uma cor só vale para o degradê inteiro", () => {
    expect(colorAt(["#ff0000"], 0)).toBe("#ff0000");
    expect(colorAt(["#ff0000"], 1)).toBe("#ff0000");
  });

  it("entre duas cores, o meio é a mistura", () => {
    expect(colorAt(["#000000", "#ffffff"], 0.5)).toBe("#808080");
    expect(colorAt(["#000000", "#ffffff"], 0)).toBe("#000000");
    expect(colorAt(["#000000", "#ffffff"], 1)).toBe("#ffffff");
  });

  it("aceita cor de três dígitos e não sai da faixa", () => {
    expect(colorAt(["#f00", "#00f"], 0.5)).toBe("#800080");
    expect(colorAt(["#000000", "#ffffff"], 5)).toBe("#ffffff");
  });

  it("monta o degradê com o ângulo escolhido", () => {
    expect(gradientOf({ colors: ["#ff0000", "#0000ff"], angle: 90, intensity: 10 })).toBe(
      "linear-gradient(90deg, #ff0000, #0000ff)",
    );
    expect(gradientOf({ colors: [], angle: 90, intensity: 10 })).toBe("none");
  });

  it("gera a folha de estilo tingindo cada superfície", () => {
    const css = appColorsCss(base, { colors: ["#ff0000"], angle: 120, intensity: 20 });

    expect(css).toContain(":root.app-colors {");
    expect(css).toContain("--color-surface-0: color-mix(in srgb, #ff0000 20%, #1a181e);");
    expect(css).toContain("--app-gradient: linear-gradient(120deg, #ff0000, #ff0000);");
  });

  it("sem cor ou com intensidade zero não escreve nada", () => {
    expect(appColorsCss(base, { colors: [], angle: 120, intensity: 20 })).toBe("");
    expect(appColorsCss(base, { colors: ["#ff0000"], angle: 120, intensity: 0 })).toBe("");
  });

  it("só toca nos tokens que existem no tema aberto", () => {
    const css = appColorsCss(base, { colors: ["#ff0000"], angle: 120, intensity: 20 });
    const written = css.match(/--color-[a-z0-9-]+:/g) ?? [];

    expect(written).toHaveLength(2);
    expect(TINTED_TOKENS.length).toBeGreaterThan(written.length);
  });
});
