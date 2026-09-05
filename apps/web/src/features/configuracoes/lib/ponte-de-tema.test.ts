import { describe, expect, it } from "vitest";

import { NOMES_DE_ORIGEM, PONTE_DE_TEMA, traduzirTema } from "./ponte-de-tema";

describe("ponte de tema", () => {
  it("traduz o fundo da lateral para o nosso nome", () => {
    expect(traduzirTema({ "--background-secondary": "#1a181e" })).toEqual({
      "--color-surface-1": "#1a181e",
    });
  });

  it("uma origem pode pintar varios dos nossos", () => {
    const saida = traduzirTema({ "--background-secondary-lighter": "#1e1d23" });

    expect(saida["--color-surface-2"]).toBe("#1e1d23");
    expect(saida["--color-composer"]).toBe("#1e1d23");
  });

  it("o cabecalho do canal vem do token proprio deles", () => {
    expect(traduzirTema({ "--background-channel-header": "#111" })["--color-cabecalho"]).toBe(
      "#111",
    );
  });

  it("varias origens podem cair no mesmo destino, e a ultima vale", () => {
    const saida = traduzirTema({
      "--background-header-secondary": "#aaa",
      "--border-color": "#bbb",
    });

    expect(saida["--color-line"]).toBe("#bbb");
  });

  it("ignora o que o tema nao declarou", () => {
    expect(traduzirTema({ "--background-secondary": "" })).toEqual({});
    expect(traduzirTema({})).toEqual({});
  });

  it("nao pisa no token que a pessoa escolheu na mao", () => {
    const saida = traduzirTema(
      { "--background-secondary": "#000" },
      new Set(["--color-surface-1"]),
    );

    expect(saida).toEqual({});
  });

  it("apara espaco em volta do valor", () => {
    expect(traduzirTema({ "--text-primary": "  #fff  " })["--color-ink"]).toBe("#fff");
  });

  it("os nomes de origem batem com o mapa", () => {
    expect(NOMES_DE_ORIGEM).toEqual(Object.keys(PONTE_DE_TEMA));
    expect(NOMES_DE_ORIGEM.every((n) => n.startsWith("--"))).toBe(true);
  });

  it("todo destino e um token nosso", () => {
    const destinos = Object.values(PONTE_DE_TEMA).flat();

    expect(destinos.every((d) => d.startsWith("--color-") || d.startsWith("--font-"))).toBe(true);
  });
});
