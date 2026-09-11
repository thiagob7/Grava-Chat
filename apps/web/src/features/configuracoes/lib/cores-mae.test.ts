import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import Color from "color";
import { describe, expect, it } from "vitest";

import {
  COLORS_BASE,
  BASE,
  TOKENS_DERIVED,
  completeWithDerivation,
  derive,
  buildTheme,
} from "~/features/configuracoes/lib/cores-mae";

const root = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(
  join(root, "..", "..", "..", "styles", "index.css"),
  "utf8",
);

function reserveColor(value: string): string {
  let v = value.trim();

  while (v.startsWith("var(")) {
    const virgula = v.indexOf(",");
    if (virgula < 0) return v;
    v = v.slice(virgula + 1, v.lastIndexOf(")")).trim();
  }

  return v;
}

function themeColors(): Record<string, string> {
  const start = css.indexOf("@theme {");
  const body = css.slice(start, css.indexOf("\n}", start));
  const colors: Record<string, string> = {};

  for (const [, name, value] of body.matchAll(
    /^\s+(--color-[\w-]+):\s*([^;]+);/gm,
  )) {
    if (name && value) colors[name] = reserveColor(value);
  }

  return colors;
}

const sameColor = (a: string, b: string) => {
  const x = Color(a);
  const y = Color(b);

  return (
    x.rgb().array().map(Math.round).join() ===
      y.rgb().array().map(Math.round).join() &&
    Math.abs(x.alpha() - y.alpha()) < 0.005
  );
};

describe("cores-mãe", () => {
  it("derivar o padrão devolve o tema base, cor por cor", () => {
    const base = themeColors();
    const different: string[] = [];

    for (const id of BASE) {
      const family = COLORS_BASE[id]!;

      for (const [name, value] of Object.entries(
        derive(id, family.fallback),
      )) {
        const expected = base[name];
        if (expected && !sameColor(expected, value)) {
          different.push(`${name}: base ${expected} · derivado ${value}`);
        }
      }
    }

    expect(different).toEqual([]);
  });

  it("clarear a mãe do fundo escurece as bordas, em vez de sumir com elas", () => {
    const dark = derive("background", "#1a181e");
    const light = derive("background", "#f2f2f4");

    const luminance = (color: string) => Color(color).lch().array()[0] ?? 0;

    expect(luminance(dark["--color-line"]!)).toBeGreaterThan(luminance("#1a181e"));
    expect(luminance(light["--color-line"]!)).toBeLessThan(luminance("#f2f2f4"));
  });

  it("o véu do modal continua escuro num tema claro", () => {
    const light = derive("background", "#f2f2f4");

    expect(Color(light["--color-veu"]!).lch().array()[0]).toBeLessThan(20);
  });

  it("o texto de cima do botão vira o polo oposto ao da marca", () => {
    const luminance = (color: string) => Color(color).lch().array()[0] ?? 0;

    expect(luminance(derive("brand", "#413cdd")["--color-sobre-marca"]!)).toBeGreaterThan(90);
    expect(luminance(derive("brand", "#f7d56e")["--color-sobre-marca"]!)).toBeLessThan(10);
  });

  it("a rampa do fundo respeita a ordem de luminosidade", () => {
    const colors = derive("background", "#123123");
    const luminance = (name: string) => Color(colors[name]!).lch().array()[0] ?? 0;

    expect(luminance("--color-surface-0")).toBeLessThanOrEqual(luminance("--color-surface-2"));
    expect(luminance("--color-surface-2")).toBeLessThanOrEqual(luminance("--color-surface-3"));
    expect(luminance("--color-surface-3")).toBeLessThanOrEqual(luminance("--color-surface-4"));
  });

  it("o fator de saturação zerado entrega cinza", () => {
    const colors = derive("brand", "#413cdd", 0);

    for (const value of Object.values(colors)) {
      const [, chroma = 0] = Color(value).lch().array();
      expect(chroma).toBeLessThan(1);
    }
  });

  it("não deixa duas mães brigando pelo mesmo token", () => {
    const all = Object.values(COLORS_BASE).flatMap((f) => [
      f.base,
      ...f.children.map((c) => c.name),
    ]);

    expect(all).toHaveLength(TOKENS_DERIVED.size);
  });

  it("o que foi mexido à mão sobrevive a uma nova derivação", () => {
    const my = { "--color-surface-2": "#0d0d0d" };

    const before = buildTheme({ background: "#1a181e" }, 1, my);
    const after = buildTheme({ background: "#2b1a3d" }, 1, my);

    expect(before["--color-surface-2"]).toBe("#0d0d0d");
    expect(after["--color-surface-2"]).toBe("#0d0d0d");

    expect(after["--color-surface-3"]).not.toBe(before["--color-surface-3"]);
  });

  it("sem mãe escolhida, o tema é só o que foi mexido à mão", () => {
    expect(buildTheme({}, 1, { "--color-ink": "#fff" })).toEqual({
      "--color-ink": "#fff",
    });
  });

  it("preenche o que o tema não disse a partir do que ele disse", () => {
    const fromTheme = { "--color-surface-0": "#1a0000" };
    const rest = completeWithDerivation(fromTheme);

    expect(rest["--color-palco"]).toBeTruthy();
    expect(rest["--color-veu"]).toBeTruthy();
    expect(rest["--color-line"]).toBeTruthy();
    expect(rest["--color-hover"]).toBeTruthy();

    const [, chroma = 0, hue = 0] = Color(rest["--color-surface-3"]!)
      .lch()
      .array();
    expect(chroma).toBeGreaterThan(1);
    expect(Math.abs(hue - (Color("#1a0000").lch().array()[2] ?? 0))).toBeLessThan(20);
  });

  it("não encosta no que o tema disse com todas as letras", () => {
    const fromTheme = {
      "--color-surface-0": "#1a0000",
      "--color-surface-3": "#00ff00",
      "--color-line": "#0000ff",
    };

    const rest = completeWithDerivation(fromTheme);

    expect(rest["--color-surface-3"]).toBeUndefined();
    expect(rest["--color-line"]).toBeUndefined();
  });

  it("sem cor de mãe no tema, não inventa nada", () => {
    expect(completeWithDerivation({ "--color-mencao": "#fff" })).toEqual({});
  });
});
